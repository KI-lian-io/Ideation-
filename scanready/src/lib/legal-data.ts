/**
 * Founder/operator identity for the legally required pages (§5 DDG, GDPR Art. 13).
 * Placeholder markers are now filled with founder-provided data. Two items still
 * need confirmation before production promotion, see docs/humanizer-golive.md:
 * (a) the street value reads like a test address and must be confirmed as the
 *     real ladungsfahige Anschrift required by §5 DDG before production promotion.
 * (b) the email was defaulted from the founder profile and needs confirmation.
 */
export const LEGAL = {
  operatorName: "Kilian Hartmann",
  street: "Teststraße 1",
  city: "22299 Hamburg",
  country: "Deutschland",
  email: "kilian.hartmann@liloplus.de",
  /** Umsatzsteer note: pick ONE line and delete the other when filling in. */
  vatLine:
    "Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.",
} as const;
