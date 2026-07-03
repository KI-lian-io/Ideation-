import { NextRequest, NextResponse } from "next/server";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, PARSE_MODEL } from "@/lib/anthropic";
import { LebenslaufSchema } from "@/lib/schema";
import { PARSE_SYSTEM, buildParseUser } from "@/lib/prompts";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/abuse-guards";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/parse  { resumeText: string }
 * Returns a structured, grounded German Lebenslauf. Stateless: nothing is stored.
 */
export async function POST(req: NextRequest) {
  const originBlock = enforceSameOrigin(req);
  if (originBlock) return originBlock;
  const rateBlock = await enforceRateLimit(req, "parse");
  if (rateBlock) return rateBlock;

  try {
    const { resumeText } = await req.json();
    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json({ error: "Lebenslauf-Text ist erforderlich." }, { status: 400 });
    }
    const RESUME_LIMIT = 30_000;
    if (resumeText.length > RESUME_LIMIT) {
      return NextResponse.json(
        { error: "Der Text ist zu lang (max. 30.000 Zeichen)." },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.parse({
      model: PARSE_MODEL,
      max_tokens: 8000,
      output_config: { format: zodOutputFormat(LebenslaufSchema) },
      system: PARSE_SYSTEM,
      messages: [{ role: "user", content: buildParseUser(resumeText) }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Request was declined." }, { status: 422 });
    }

    return NextResponse.json({ lebenslauf: response.parsed_output });
  } catch (err) {
    console.error("parse error", err);
    return NextResponse.json({ error: "Failed to parse CV." }, { status: 500 });
  }
}
