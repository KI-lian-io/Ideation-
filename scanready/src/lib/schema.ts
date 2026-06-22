import { z } from "zod";

/**
 * Structured shape of a German tabellarischer Lebenslauf.
 *
 * Grounding rule (enforced in the prompt, mirrored here): every field must come
 * from the source CV. Unknown fields are null/empty — the model must NOT invent
 * employers, titles, dates, or skills. `photoAdvice` is guidance, not a claim.
 */
export const LebenslaufSchema = z.object({
  personal: z.object({
    fullName: z.string(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    nationality: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
  }),
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
  skills: z.array(z.string()),
  languages: z.array(
    z.object({ language: z.string(), level: z.string().nullable() })
  ),
  /** What changed vs. a US/UK resume and WHY — the norm-gap education. */
  normGapNotes: z.array(z.string()),
  /** Nuanced photo guidance — optional by AGG, expected by most recruiters. */
  photoAdvice: z.string(),
});

export type Lebenslauf = z.infer<typeof LebenslaufSchema>;
