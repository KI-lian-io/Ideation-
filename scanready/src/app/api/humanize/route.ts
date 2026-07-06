import { NextRequest, NextResponse } from "next/server";
import { anthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { checkHumanizerEntitlement } from "@/lib/humanizer";
import {
  HUMANIZER_SYSTEM,
  HUMANIZER_DIRECTIONS,
  buildHumanizerUser,
  type HumanizerDirection,
} from "@/lib/prompts";
import { enforceRateLimit, enforceSameOrigin, sentinelVerdict, INVALID_INPUT_SENTINEL, readJsonObject } from "@/lib/abuse-guards";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/humanize
 *   { letterText: string, direction: 'formeller'|'moderner'|'praegnanter', paymentIntentId: string }
 * Verifies the paid, unconsumed PaymentIntent, streams the refined letter, then marks
 * the PI consumed. Consumed is set only AFTER a complete stream so failures are
 * retryable; the metadata update is not atomic: a deliberate double-submit can get
 * two refinements for one payment (accepted: costs ~cents, spec D8). If the client
 * disconnects mid-stream, `cancel()` aborts the Anthropic stream so the for-await
 * throws and the PI is left unconsumed (retryable) instead of being marked spent.
 */
export async function POST(req: NextRequest) {
  const originBlock = enforceSameOrigin(req);
  if (originBlock) return originBlock;
  const rateBlock = await enforceRateLimit(req, "humanize");
  if (rateBlock) return rateBlock;

  const reqBody = await readJsonObject(req);
  const letterText = reqBody?.letterText;
  const direction = reqBody?.direction;
  const paymentIntentId = reqBody?.paymentIntentId;

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
  // Accepts both PI kinds: a standalone Humanizer+ purchase, or a
  // Bewerbungspaket whose included refinement is still unused (spec D3).
  const check = checkHumanizerEntitlement(pi);
  if (!check.ok) {
    const messages: Record<string, string> = {
      not_paid: "Die Zahlung ist noch nicht abgeschlossen.",
      consumed: "Diese Zahlung wurde bereits eingelöst.",
      wrong_feature: "Ungültige Zahlungsreferenz.",
    };
    // reason is machine-readable: the client uses 'consumed' to fall back from
    // a spent paket refinement to the normal payment step.
    return NextResponse.json({ error: messages[check.reason], reason: check.reason }, { status: 402 });
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
      let buffer = "";
      let gate: "pending" | "clean" | "sentinel" = "pending";
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            if (gate === "clean") {
              controller.enqueue(encoder.encode(event.delta.text));
              continue;
            }
            buffer += event.delta.text;
            gate = sentinelVerdict(buffer, false);
            if (gate === "sentinel") {
              // Injection/garbage input: stop paying for tokens and pass the sentinel
              // through as the (whole) response body: the client recognizes it and
              // shows a specific German error. No controller.error: that produced an
              // opaque "failed to pipe response" 500. This return is BEFORE the
              // consume-mark below: the PI stays redeemable, same as any other
              // failed-refinement path.
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
        console.error("humanize stream error", err); // never letter content
        try {
          controller.error(err);
        } catch {
          // stream already cancelled by the client: nothing to signal
        }
        return; // PI stays unconsumed → client may retry
      }
      if (req.signal.aborted) {
        // Disconnect raced with natural stream completion: the client never
        // received the full letter, so leave the PI redeemable.
        return;
      }
      // Mark the entitlement spent only after a full successful stream. Which
      // flag depends on the PI kind: a standalone humanizer PI is fully
      // consumed; a paket PI only spends its included refinement, the PDF
      // export unlock (checkPaketPi) must survive this update.
      try {
        await getStripe().paymentIntents.update(
          paymentIntentId,
          check.kind === "paket"
            ? { metadata: { feature: "paket", humanizer_used: "true" } }
            : { metadata: { feature: "humanizer", consumed: "true" } }
        );
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
