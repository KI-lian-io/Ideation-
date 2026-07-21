import { z } from "zod";

/**
 * Structured shape of a German tabellarischer Lebenslauf.
 *
 * Grounding rule (enforced in the prompt, mirrored here): every field must come
 * from the source CV. Unknown fields are null/empty: the model must NOT invent
 * employers, titles, dates, or skills. `photoAdvice` is guidance, not a claim.
 */

/**
 * A skill category for the German Kenntnisse section (D-09).
 * `category` holds labels such as "IT-Kenntnisse", "Fachkenntnisse", "Sonstige Kenntnisse".
 * `skills` lists entries from the source CV: never invented.
 */
export const SkillCategorySchema = z.object({
  category: z.string(),
  skills: z.array(z.string()),
});

export const LebenslaufSchema = z.object({
  personal: z.object({
    fullName: z.string(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    nationality: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
  }),
  /** Concise German Kurzprofil (2-4 lines). ONLY derived from a professional
   * summary / profile / objective present in the source CV, reworded into
   * German; null when the source has none. Never composed from scratch. */
  profil: z.string().nullable(),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      location: z.string().nullable(),
      start: z.string().nullable(),
      end: z.string().nullable(), // e.g. "heute" / null if unknown
      bullets: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      qualification: z.string(),
      institution: z.string(),
      location: z.string().nullable(),
      start: z.string().nullable(),
      end: z.string().nullable(),
    })
  ),
  skills: z.array(SkillCategorySchema),
  languages: z.array(
    z.object({ language: z.string(), level: z.string().nullable() })
  ),
  /** What changed vs. a US/UK resume and WHY: the norm-gap education. Bilingual so
   * the UI can render the note in whichever interface language is active (see
   * src/lib/i18n.tsx); the underlying fact and change described is identical in
   * both languages, only the wording adapts. */
  normGapNotes: z.array(z.object({ en: z.string(), de: z.string() })),
  /** Nuanced photo guidance: optional by AGG, expected by most recruiters. Bilingual
   * for the same reason as normGapNotes above. */
  photoAdvice: z.object({ en: z.string(), de: z.string() }),
});

export type Lebenslauf = z.infer<typeof LebenslaufSchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
