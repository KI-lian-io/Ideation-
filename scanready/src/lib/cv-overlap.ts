/**
 * Pure CV-overlap heuristic used to preselect the attach-or-new radio in the
 * save flow (SaveApplicationButton, src/app/app/page.tsx). No React, no I/O:
 * exercisable directly by `node --test` via the explicit `.ts` extension
 * import convention this project uses for its other pure-logic modules (see
 * src/lib/account.ts lines 1-8, src/lib/subscription.ts lines 12-17).
 *
 * Design source: .planning/phases/08-.../08-CONTEXT.md ("Claude's Discretion:
 * exact overlap metric, >80% anchor") and the 07-lebenslaeufe.dc.html 1b
 * mockup annotation ("Attach is preselected when a matching CV exists (same
 * person, >80% overlap)").
 */

/** Preselect "attach to existing CV" once the overlap ratio reaches this. */
export const CV_ATTACH_THRESHOLD = 0.8

/**
 * Lowercased, whitespace-tokenized set overlap: intersection size over the
 * SMALLER of the two token sets (not the union/Jaccard denominator). This is
 * deliberate: a shorter edit of the same CV (a trimmed section, a removed
 * bullet) should still preselect attach, since every token in the smaller
 * set is present in the larger one. A pure Jaccard ratio would instead
 * dilute that same case toward 0 as the larger text grows, which is the
 * wrong bias for this feature (missing an attach match is worse than an
 * occasional over-eager one, since save-as-new is always one click away).
 * Returns 0 whenever either input is empty (no signal, not a crash).
 */
export function cvOverlapRatio(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean))
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean))
  if (setA.size === 0 || setB.size === 0) return 0

  let intersectionSize = 0
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA]
  for (const token of smaller) {
    if (larger.has(token)) intersectionSize += 1
  }
  return intersectionSize / smaller.size
}

/**
 * Finds the single best-matching CV for the current CV text, or null when no
 * candidate reaches CV_ATTACH_THRESHOLD. Ties (equal top ratio) resolve to
 * whichever candidate comes first in the input array; callers pass cvs
 * already ordered newest-first (listCvs), so a tie prefers the most recent.
 */
export function bestCvMatch(
  currentText: string,
  cvs: { id: string; cv_text: string }[]
): { id: string; ratio: number } | null {
  let best: { id: string; ratio: number } | null = null
  for (const cv of cvs) {
    const ratio = cvOverlapRatio(currentText, cv.cv_text)
    if (ratio >= CV_ATTACH_THRESHOLD && (best === null || ratio > best.ratio)) {
      best = { id: cv.id, ratio }
    }
  }
  return best
}
