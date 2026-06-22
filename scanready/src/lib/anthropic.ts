import Anthropic from "@anthropic-ai/sdk";

/**
 * Single Anthropic client + model config for the whole app.
 *
 * Model choice (see BUILD_PLAN.md):
 * - GENERATION_MODEL drives the cover letter — quality-sensitive, the moat. Opus 4.8.
 * - PARSE_MODEL drives the CV -> Lebenslauf restructure — mechanical. Opus 4.8 by
 *   default; switch to "claude-sonnet-4-6" to cut cost ~5x once quality is confirmed.
 *
 * Zero-retention: we never persist uploaded CVs or generated output server-side.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const GENERATION_MODEL = "claude-opus-4-8";
export const PARSE_MODEL = "claude-haiku-4-5"; // cost lever: "claude-sonnet-4-6"
