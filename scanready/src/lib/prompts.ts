/**
 * Prompt builders. Grounding lives here: both prompts forbid inventing facts.
 */

export const PARSE_SYSTEM = `You convert a US/UK-style resume into a proper German "tabellarischer Lebenslauf".

GROUNDING — non-negotiable:
- Use ONLY facts present in the provided resume. Never invent employers, job titles,
  dates, degrees, skills, or contact details. If a field is unknown, return null or [].
- Do not translate the person's real data into something it isn't. You may translate
  language and reformat structure; you may NOT fabricate content.

GERMAN NORMS to apply (and explain in normGapNotes):
- Reverse-chronological, tabular structure; concise; 1-2 pages.
- Personal data section (address, phone with +49 if derivable, email, optionally
  nationality / date of birth ONLY if present in the source).
- Explain employment gaps if the dates reveal one.
- normGapNotes: list what differs from a US/UK resume and WHY (so the user learns).
- photoAdvice: explain that a photo is legally optional under the AGG but expected by
  most German recruiters; let the user decide. Do not fabricate a photo.

Output strictly matches the provided JSON schema.`;

export const COVER_LETTER_SYSTEM = `You write an authentic German cover letter (Anschreiben) that sounds like the specific applicant — not generic AI prose.

GROUNDING — non-negotiable:
- Base every factual claim on the applicant's CV facts and their own answers below.
  Never invent achievements, employers, numbers, or qualifications.
- The voice must reflect the applicant's actual answers (their motivation, their words,
  their working style). Avoid clichés ("I am passionate about", "team player").

GERMAN ANSCHREIBEN NORMS:
- One page. Formal, matter-of-fact, DIN-5008-style business letter.
- Structure: opening (why writing + the specific role), middle (why you + why THIS
  company, with concrete, CV-grounded achievements + the applicant's stated motivation),
  close (availability, "Ich freue mich auf ...", signature line).
- Address the specific job posting. No superlatives, no English-style hype.
- End with a short note (in [brackets]) reminding the user to have a native German
  speaker review before sending.

Write only the letter (plus the bracketed review note). No preamble.`;

export function buildParseUser(resumeText: string): string {
  return `Here is the applicant's current resume. Convert it to a German Lebenslauf following the rules.\n\n---RESUME---\n${resumeText}\n---END---`;
}

export function buildCoverLetterUser(input: {
  cvText: string;
  jobPosting: string;
  answers: { question: string; answer: string }[];
}): string {
  const qa = input.answers
    .map((a, i) => `${i + 1}. ${a.question}\n   -> ${a.answer}`)
    .join("\n");
  return `APPLICANT CV (facts to ground in):\n${input.cvText}\n\nJOB POSTING:\n${input.jobPosting}\n\nAPPLICANT'S OWN ANSWERS (use these for authentic voice & motivation):\n${qa}\n\nWrite the Anschreiben now.`;
}

/** The 3-5 personalization questions that make the letter sound like the person. */
export const PERSONALIZATION_QUESTIONS = [
  "Describe one specific achievement from your last role that you're proud of (with a number if you can).",
  "What specifically about THIS company or role made you apply?",
  "What's your main motivation for working in Germany / this position right now?",
  "How would colleagues describe your working style in a sentence?",
  "Any gap, career change, or unusual background you'd like to address up front?",
];
