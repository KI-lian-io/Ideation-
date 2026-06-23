import Anthropic from "@anthropic-ai/sdk";

/**
 * Single Anthropic client + model config for the whole app.
 *
 * Model choice (see BUILD_PLAN.md):
 * - GENERATION_MODEL drives the cover letter. Sonnet 4.6 (documented fallback, D-05):
 *   Opus 4.8 + adaptive thinking risked the 300s Hobby function ceiling, so we run the
 *   cover letter on Sonnet to keep the stream well under budget. Pipeline logic unchanged.
 *   Revert to "claude-opus-4-8" if the quality delta proves worth a Pro-tier 800s ceiling.
 * - PARSE_MODEL drives the CV -> Lebenslauf restructure — mechanical, structured-output.
 *
 * Zero-retention: we never persist uploaded CVs or generated output server-side.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const GENERATION_MODEL = "claude-sonnet-4-6"; // was claude-opus-4-8 — see D-05 fallback above
export const PARSE_MODEL = "claude-haiku-4-5"; // cost lever: "claude-sonnet-4-6"
