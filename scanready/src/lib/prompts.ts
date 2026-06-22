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
- normGapNotes: for each structural or content change made, write ONE line in English:
  "[Change made] — [why this matters in the 8-second German recruiter scan]".
  Example: "Added personal-data block — recruiters look for name, address, phone in the top section."
  Be concise. Do not repeat content already visible in the Lebenslauf.
  GROUNDING: notes must describe actual changes made, not fabricate improvements that were not possible.
- Skills section: group skills into German-conventional categories.
  Use "IT-Kenntnisse" for software, programming, and technical tools.
  Use "Fachkenntnisse" for domain/industry-specific knowledge.
  Use "Sonstige Kenntnisse" for certifications, driver's licenses, and other qualifications.
  Only include categories that have entries from the source CV. Do not invent skills.
  Do not list soft skills as standalone entries — omit or weave into experience bullets.
- Language levels: map the applicant's stated proficiency to German CV vocabulary.
  Use exactly one of: Muttersprache, Verhandlungssicher, Fließend, Gute Kenntnisse, Grundkenntnisse.
  Do not use CEFR codes (A1/B2/C1), "native", "fluent", or free-form text.
  Mapping guide: native → Muttersprache; business fluent / C1-C2 → Verhandlungssicher;
  fluent / conversational / B2 → Fließend; intermediate / B1 → Gute Kenntnisse;
  basic / A1-A2 → Grundkenntnisse. If level is completely absent, return null.
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

Write only the letter. No preamble.`;

export function buildParseUser(resumeText: string): string {
  return `Here is the applicant's current resume. Convert it to a German Lebenslauf following the rules.\n\n---RESUME---\n${resumeText}\n---END---`;
}

export function buildCoverLetterUser(input: {
  cvText: string;
  jobPosting: string;
  answers: { question: string; answer: string }[];
}): string {
  // Filter out blank answers (all five are initialized to "") so we never emit
  // dangling "N. <question>\n   -> " lines. Empty Q/A noise could subtly nudge
  // the model to invent content — at odds with the anti-fabrication guardrail (IN-04).
  const qa = input.answers
    .filter((a) => a.answer.trim().length > 0)
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
