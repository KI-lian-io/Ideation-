// src/lib/sentinel.ts
//
// Client-safe by design: ZERO imports. This module is pure constants/functions
// so it can be imported from browser code (page.tsx, HumanizerModal.tsx)
// without pulling in abuse-guards.ts's server-only baggage (node:crypto,
// next/server, Upstash).

/** Sentinel emitted by the model when inputs aren't a real CV/posting/letter. */
export const INVALID_INPUT_SENTINEL = "UNGÜLTIGE EINGABE";

/**
 * Streaming gate: buffer the first chunks until we can tell whether the model
 * emitted the invalid-input sentinel. 'pending' = keep buffering (buffer is
 * still a strict prefix-candidate shorter than the sentinel and stream not done).
 */
export function sentinelVerdict(buffer: string, done: boolean): "pending" | "clean" | "sentinel" {
  const probe = buffer.trimStart();
  if (probe.startsWith(INVALID_INPUT_SENTINEL)) return "sentinel";
  if (!done && probe.length < INVALID_INPUT_SENTINEL.length && INVALID_INPUT_SENTINEL.startsWith(probe)) {
    return "pending";
  }
  return "clean";
}
