// src/instrumentation-client.ts
//
// Next.js file convention (see node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/instrumentation-client.md): runs after HTML load, before
// hydration. Used here only to initialize PostHog client-side analytics.
//
// Fail-open by design, same convention as src/lib/abuse-guards.ts's Upstash check:
// if NEXT_PUBLIC_POSTHOG_KEY is unset (local dev, or not yet provisioned), analytics
// is simply never initialized and track() in src/lib/analytics.ts silently no-ops.
// No feature depends on analytics running - it is purely observational.
//
// GDPR / zero-retention posture (see docs/humanizer-golive.md "Analytics setup"):
//   - api_host defaults to the EU cloud endpoint (data residency)
//   - persistence: 'memory' - NO cookies, NO localStorage. Keeps the Datenschutz
//     page's "keine Cookies" claim literally true for the anonymous flow. Trade-off:
//     each visit gets a fresh anonymous id (no cross-session recognition) - accepted
//     and intentional, not a bug.
//   - autocapture / session recording disabled - only the explicit events named in
//     src/lib/analytics.ts are ever sent, and none of them carry user content.
//   - person_profiles: 'identified_only' + identify() is never called anywhere in
//     this codebase, so no person profiles are ever created - events stay fully
//     anonymous events, matching the tool's zero-retention/no-accounts model.
import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      persistence: "memory",
      autocapture: false,
      capture_pageview: true,
      disable_session_recording: true,
      person_profiles: "identified_only",
    });
  } catch (err) {
    // Never let analytics init break the app - Next's own doc recommends try/catch here.
    console.warn("instrumentation-client: PostHog init failed", err);
  }
}
