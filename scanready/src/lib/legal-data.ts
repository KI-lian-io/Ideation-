/**
 * Founder/operator identity for the legally required pages (§5 DDG, GDPR Art. 13).
 * All values are founder-provided. One item still needs confirmation before
 * production promotion, see docs/humanizer-golive.md: the street value reads
 * like a test address and must be confirmed as the real ladungsfahige
 * Anschrift required by §5 DDG. The email is founder-confirmed (2026-07-17).
 */
export const LEGAL = {
  operatorName: "Kilian Hartmann",
  street: "Teststraße 1",
  city: "22299 Hamburg",
  country: "Deutschland",
  email: "kilian.hartmann93@gmail.com",
  /** Umsatzsteer note: pick ONE line and delete the other when filling in. */
  vatLine:
    "Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.",
} as const;
