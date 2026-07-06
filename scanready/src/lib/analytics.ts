// src/lib/analytics.ts
//
// Tiny typed wrapper around posthog-js. PostHog is initialized (or not) in
// src/instrumentation-client.ts based on NEXT_PUBLIC_POSTHOG_KEY - fail-open,
// same convention as src/lib/abuse-guards.ts's Upstash check. track() below
// no-ops whenever that init never ran, so every call site can fire-and-forget
// without an env check of its own.
//
// HARD RULE: props must never contain user content or PII - no CV text, no
// letter text, no email, no job posting, no error message bodies. Only the
// enumerated boolean/enum-ish flags below. This file only accepts events from
// the AnalyticsEvent union and the narrow prop shapes declared per event, so a
// call site literally cannot pass free-form user content through this API.
"use client";

import posthog from "posthog-js";

/**
 * Every event this app emits. Kept as a union (not a bare string) so an event
 * name typo or drift is a compile error, not a silent analytics gap.
 */
export type AnalyticsEvent =
  | "cv_submitted"
  | "parse_done"
  | "letter_done"
  | "copy_download"
  | "humanizer_opened"
  | "humanizer_paid"
  | "humanizer_done"
  | "paket_opened"
  | "paket_paid";

type AnalyticsProps = {
  copy_download: {
    kind: "lebenslauf_copy" | "letter_copy" | "letter_download" | "lebenslauf_pdf" | "letter_pdf";
  };
};

type PropsFor<E extends AnalyticsEvent> = E extends keyof AnalyticsProps ? AnalyticsProps[E] : never;

/**
 * Fires a product analytics event. No-ops (does nothing, never throws) when
 * PostHog was never initialized - see the fail-open note above. Never await
 * this; it is fire-and-forget by design so a tracking hiccup can't block the
 * user flow (parse/letter/payment all proceed regardless of this call).
 */
export function track<E extends AnalyticsEvent>(
  event: E,
  ...args: PropsFor<E> extends never ? [] : [props: PropsFor<E>]
): void {
  if (!posthog.__loaded) return;
  try {
    posthog.capture(event, args[0]);
  } catch {
    // Swallow - a tracking failure must never break the CV/letter/payment flow.
  }
}
