import { NextRequest } from "next/server";
import { anthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { COVER_LETTER_SYSTEM, buildCoverLetterUser } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/cover-letter
 *   { cvText: string, jobPosting: string, answers: {question,answer}[] }
 * Streams an authentic, grounded German Anschreiben as plain text. Stateless.
 */
export async function POST(req: NextRequest) {
  const { cvText, jobPosting, answers } = await req.json();
  if (!cvText || !jobPosting || !Array.isArray(answers)) {
    return new Response("cvText, jobPosting and answers are required", {
      status: 400,
    });
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
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
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
