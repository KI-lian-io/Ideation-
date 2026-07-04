import { NextRequest, NextResponse } from "next/server";
import { anthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { COVER_LETTER_SYSTEM, buildCoverLetterUser } from "@/lib/prompts";
import { enforceRateLimit, enforceSameOrigin, sentinelVerdict, INVALID_INPUT_SENTINEL, readJsonObject, isValidAnswers } from "@/lib/abuse-guards";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/cover-letter
 *   { cvText: string, jobPosting: string, answers: {question,answer}[] }
 * Streams an authentic, grounded German Anschreiben as plain text. Stateless.
 */
export async function POST(req: NextRequest) {
  const originBlock = enforceSameOrigin(req);
  if (originBlock) return originBlock;
  const rateBlock = await enforceRateLimit(req, "letter");
  if (rateBlock) return rateBlock;

  const reqBody = await readJsonObject(req);
  const cvText = reqBody?.cvText;
  const jobPosting = reqBody?.jobPosting;
  const answers = reqBody?.answers;
  if (
    !cvText ||
    typeof cvText !== "string" ||
    !jobPosting ||
    typeof jobPosting !== "string" ||
    !isValidAnswers(answers)
  ) {
    return NextResponse.json(
      { error: "cvText, jobPosting und answers sind erforderlich." },
      { status: 400 }
    );
  }
  // Length guards (D-01): reject before stream / Anthropic cost
  const CV_LIMIT = 30_000;
  const POSTING_LIMIT = 15_000;
  const ANSWER_LIMIT = 2_000;
  if (cvText.length > CV_LIMIT) {
    return NextResponse.json(
      { error: "Der Lebenslauf-Text ist zu lang (max. 30.000 Zeichen)." },
      { status: 400 }
    );
  }
  if (jobPosting.length > POSTING_LIMIT) {
    return NextResponse.json(
      { error: "Das Stellenangebot ist zu lang (max. 15.000 Zeichen)." },
      { status: 400 }
    );
  }
  for (const ans of answers) {
    if (typeof ans.answer === "string" && ans.answer.length > ANSWER_LIMIT) {
      return NextResponse.json(
        { error: "Eine Antwort ist zu lang (max. 2.000 Zeichen)." },
        { status: 400 }
      );
    }
  }

  const stream = anthropic.messages.stream({
    model: GENERATION_MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: COVER_LETTER_SYSTEM,
    messages: [
      { role: "user", content: buildCoverLetterUser({ cvText, jobPosting, answers }) },
    ],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      let gate: "pending" | "clean" | "sentinel" = "pending";
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            if (gate === "clean") {
              controller.enqueue(encoder.encode(event.delta.text));
              continue;
            }
            buffer += event.delta.text;
            gate = sentinelVerdict(buffer, false);
            if (gate === "sentinel") {
              // Injection/garbage input: stop paying for tokens and pass the sentinel
              // through as the (whole) response body — the client recognizes it and
              // shows a specific German error. No controller.error: that produced an
              // opaque "failed to pipe response" 500.
              stream.controller.abort();
              controller.enqueue(encoder.encode(INVALID_INPUT_SENTINEL));
              controller.close();
              return;
            }
            if (gate === "clean") {
              controller.enqueue(encoder.encode(buffer));
              buffer = "";
            }
          }
        }
        if (gate === "pending" && sentinelVerdict(buffer, true) === "clean" && buffer) {
          controller.enqueue(encoder.encode(buffer)); // stream ended shorter than sentinel
        }
      } catch (err) {
        console.error("cover-letter stream error", err);
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
