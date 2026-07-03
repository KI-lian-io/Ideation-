/**
 * Founder/operator identity for the legally required pages (§5 DDG, GDPR Art. 13).
 * FOUNDER ACTION REQUIRED: replace every value below with real data before deploy.
 * The build intentionally works with these placeholders so development isn't blocked,
 * but go-live with placeholder values is a legal violation — see docs/humanizer-golive.md.
 */
export const LEGAL = {
  operatorName: "FOUNDER_TODO Vorname Nachname",
  street: "FOUNDER_TODO Straße Hausnummer",
  city: "FOUNDER_TODO PLZ Ort",
  country: "Deutschland",
  email: "FOUNDER_TODO kontakt@example.com",
  /** Umsatzsteer note: pick ONE line and delete the other when filling in. */
  vatLine:
    "Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.",
} as const;
