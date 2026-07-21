// src/lib/abuse-guards.ts
import { createHash } from "node:crypto";
// Explicit .js extension: plain `node --test` (this project's test runner) resolves
// bare ESM subpath imports strictly (no extension-guessing) even though Next's own
// bundler and `tsc --moduleResolution bundler` both accept the extensionless form.
import { NextRequest, NextResponse } from "next/server.js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Re-exported for compat: the sentinel constant/function moved to sentinel.ts
// (client-safe: zero imports) so browser code can import it without pulling in
// this file's server-only baggage (node:crypto, next/server, Upstash).
export { INVALID_INPUT_SENTINEL, sentinelVerdict } from "./sentinel.ts";

/**
 * Abuse guards for the Claude-backed routes: per-IP rate limiting (Upstash,
 * sliding window, hashed IPs with short TTL, GDPR: Art. 6(1)(f) transient
 * abuse prevention) and a same-origin check for browser-only endpoints.
 *
 * Fail-open by design: if Upstash env vars are unset (local dev, or not yet
 * provisioned), requests are allowed and a single warning is logged. The hard
 * cost ceiling lives in the Anthropic console spend cap, not here.
 */

const RATE_LIMITS = {
  // ponytail: generous-for-humans, fatal-for-scripts. Tune from logs if needed.
  parse: { limit: 5, window: "1 h" },
  letter: { limit: 10, window: "1 h" },
  intent: { limit: 10, window: "1 h" },
  // Generous: paid-gated route, but PI verify + Claude retries are free to spam
  // without a bucket. Legitimate retries (network hiccup, disconnect) must never hit it.
  humanize: { limit: 20, window: "1 h" },
} as const;

export type RateBucket = keyof typeof RATE_LIMITS;

let redis: Redis | null = null;
let warned = false;
const limiters = new Map<RateBucket, Ratelimit>();

function getLimiter(bucket: RateBucket): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!warned) {
      console.warn("abuse-guards: Upstash env unset, rate limiting disabled (fail-open)");
      warned = true;
    }
    return null;
  }
  redis ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  let limiter = limiters.get(bucket);
  if (!limiter) {
    const { limit, window } = RATE_LIMITS[bucket];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `rl:${bucket}`,
    });
    limiters.set(bucket, limiter);
  }
  return limiter;
}

/**
 * Parse the JSON body of a request; null when malformed or not a plain object.
 * Centralizes the try/catch so a bare `req.json()` (which throws on malformed
 * bodies or non-JSON) can never surface as an uncaught 500: routes map null
 * to their existing German 400 shape instead.
 */
export async function readJsonObject(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

/** Shape of one cover-letter personalization Q&A pair. */
export type AnswerEntry = { question: string; answer: string };

/**
 * True when `value` is a well-formed answers[] array for /api/cover-letter:
 * a plain array, capped at `maxCount` (default 10, aggregate-size bypass of
 * the per-field ANSWER_LIMIT otherwise), where every element is a
 * {question, answer} pair of strings. A non-object element (e.g. `null`)
 * would otherwise crash the route with a TypeError on `ans.answer`.
 */
export function isValidAnswers(value: unknown, maxCount = 10): value is AnswerEntry[] {
  return (
    Array.isArray(value) &&
    value.length <= maxCount &&
    value.every(
      (a): a is AnswerEntry =>
        !!a &&
        typeof a === "object" &&
        typeof (a as Record<string, unknown>).answer === "string" &&
        typeof (a as Record<string, unknown>).question === "string"
    )
  );
}

/** First hop of x-forwarded-for (Vercel sets it), hashed so no raw IP is stored. */
export function clientIdFrom(headers: Headers): string {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/** Returns a 429 response to send, or null to proceed. */
export async function enforceRateLimit(
  req: NextRequest,
  bucket: RateBucket
): Promise<NextResponse | null> {
  const limiter = getLimiter(bucket);
  if (!limiter) return null; // fail-open: unconfigured
  try {
    const { success, reset } = await limiter.limit(clientIdFrom(req.headers));
    if (success) return null;
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Zu viele Anfragen, bitte versuchen Sie es später erneut." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  } catch (err) {
    console.error("abuse-guards ratelimit error", err); // Upstash outage → fail-open
    return null;
  }
}

/**
 * Browser-only endpoints: the Origin header must be present and match the
 * request's own host. Blocks lazy curl/cross-site embedding; not a substitute
 * for rate limiting (headers are spoofable by determined clients).
 */
export function enforceSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host === host) return null;
    } catch {
      // malformed Origin falls through to rejection
    }
  }
  return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
}
