import { NextRequest, NextResponse } from "next/server";
import { anthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { checkHumanizerPi } from "@/lib/humanizer";
import {
  HUMANIZER_SYSTEM,
  HUMANIZER_DIRECTIONS,
  buildHumanizerUser,
  type HumanizerDirection,
} from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/humanize
 *   { letterText: string, direction: 'formeller'|'moderner'|'praegnanter', paymentIntentId: string }
 * Verifies the paid, unconsumed PaymentIntent, streams the refined letter, then marks
 * the PI consumed. Consumed is set only AFTER a complete stream so failures are
 * retryable; the metadata update is not atomic — a deliberate double-submit can get
 * two refinements for one payment (accepted: costs ~cents, spec D8). If the client
 * disconnects mid-stream, `cancel()` aborts the Anthropic stream so the for-await
 * throws and the PI is left unconsumed (retryable) instead of being marked spent.
 */
export async function POST(req: NextRequest) {
  const { letterText, direction, paymentIntentId } = await req.json();

  if (!letterText || typeof letterText !== "string" || typeof paymentIntentId !== "string" || typeof direction !== "string" || !Object.prototype.hasOwnProperty.call(HUMANIZER_DIRECTIONS, direction)) {
    return NextResponse.json(
      { error: "letterText, direction und paymentIntentId sind erforderlich." },
      { status: 400 }
    );
  }
  const LETTER_LIMIT = 10_000;
  if (letterText.length > LETTER_LIMIT) {
    return NextResponse.json(
      { error: "Das Anschreiben ist zu lang (max. 10.000 Zeichen)." },
      { status: 400 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Zahlungen sind derzeit nicht verfügbar." },
      { status: 503 }
    );
  }

  let pi;
  try {
    pi = await getStripe().paymentIntents.retrieve(paymentIntentId);
  } catch {
    return NextResponse.json(
      { error: "Zahlung konnte nicht überprüft werden. Bitte erneut versuchen." },
      { status: 502 }
    );
  }
  const check = checkHumanizerPi(pi);
  if (!check.ok) {
    const messages: Record<string, string> = {
      not_paid: "Die Zahlung ist noch nicht abgeschlossen.",
      consumed: "Diese Zahlung wurde bereits eingelöst.",
      wrong_feature: "Ungültige Zahlungsreferenz.",
    };
    return NextResponse.json({ error: messages[check.reason] }, { status: 402 });
  }

  const stream = anthropic.messages.stream({
    model: GENERATION_MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: HUMANIZER_SYSTEM,
    messages: [
      { role: "user", content: buildHumanizerUser(letterText, direction as HumanizerDirection) },
    ],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("humanize stream error", err); // never letter content
        try {
          controller.error(err);
        } catch {
          // stream already cancelled by the client — nothing to signal
        }
        return; // PI stays unconsumed → client may retry
      }
      // Mark consumed only after a full successful stream.
      try {
        await getStripe().paymentIntents.update(paymentIntentId, {
          metadata: { feature: "humanizer", consumed: "true" },
        });
      } catch (err) {
        console.error("humanize consume-mark error", err); // user got their letter; worst case a free retry window
      }
      controller.close();
    },
    cancel() {
      // Client disconnected: stop paying Anthropic for tokens nobody receives.
      // The abort surfaces as a throw in the for-await above → caught → PI unconsumed.
      stream.controller.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
