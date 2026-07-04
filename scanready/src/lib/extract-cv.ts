// src/lib/extract-cv.ts
/**
 * Client-side CV text extraction. Runs entirely in the browser — the file is
 * never uploaded anywhere (zero-retention). unpdf is imported dynamically so
 * the PDF.js payload only loads when a user actually picks a PDF.
 */

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export type ExtractError = "too_large" | "unsupported_type" | "empty_extraction";

export class CvExtractError extends Error {
  readonly reason: ExtractError;
  constructor(reason: ExtractError) {
    super(reason);
    this.reason = reason;
  }
}

/** Pure guard — separated from extraction so it's unit-testable without a File. */
export function validateCvFile(file: { name: string; size: number; type: string }): ExtractError | null {
  if (file.size > MAX_FILE_BYTES) return "too_large";
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isTxt = file.type === "text/plain" || name.endsWith(".txt");
  if (!isPdf && !isTxt) return "unsupported_type";
  return null;
}

export async function extractCvText(file: File): Promise<string> {
  const invalid = validateCvFile(file);
  if (invalid) throw new CvExtractError(invalid);

  const name = file.name.toLowerCase();
  let text: string;
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const result = await extractText(pdf, { mergePages: true });
    text = result.text;
  } else {
    text = await file.text();
  }

  const cleaned = text.replace(/[ \t]+\n/g, "\n").trim();
  if (cleaned.length < 50) {
    // Scanned/image-only PDF (no text layer) or an effectively empty file.
    throw new CvExtractError("empty_extraction");
  }
  return cleaned;
}

/** German user-facing message per failure reason. */
export const EXTRACT_ERROR_MESSAGES: Record<ExtractError, string> = {
  too_large: "Die Datei ist zu groß (max. 10 MB).",
  unsupported_type: "Bitte eine PDF- oder .txt-Datei wählen.",
  empty_extraction:
    "Aus dieser Datei ließ sich kein Text lesen — vermutlich ein gescanntes PDF. Bitte kopieren Sie den Text stattdessen manuell in das Feld.",
};
