---
phase: 02
slug: cover-letter-flow
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-22
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Verdict: **SECURED** — 8/8 threats closed (ASVS L1, block_on: high). Register authored at plan time; mitigations verified against the implementation by gsd-security-auditor.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| client → /api/cover-letter | Untrusted job posting + 5 free-text answers + cvText snapshot cross from the browser to the Node route, then to the Claude API. | User-supplied text (job posting, personalization answers), derived CV plaintext |
| Claude API → browser DOM | AI-generated letter text streams back and is rendered into the DOM. | Model-generated German letter text |
| AI/user content → browser DOM | The finished (then user-edited) letter is rendered into a controlled `<textarea>` and a static trust callout. | Letter text (AI + user edits) |
| browser → user filesystem | The `.txt` download writes user-held letter content to disk via a browser-native Blob — no server involvement. | Letter text the user already holds |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Tampering (XSS) | Streamed `letterText` render (CoverLetterStreamingView) | mitigate | Text node `<pre>{letterText}</pre>` (`page.tsx:692`); no `dangerouslySetInnerHTML` JSX attribute | closed |
| T-02-02 | Tampering (prompt injection) | Job posting + answers → `COVER_LETTER_SYSTEM` | mitigate | GROUNDING / anti-fabrication directives intact (`prompts.ts:42-44`); D-09 removed only the bracket note | closed |
| T-02-03 | Information disclosure | resumeText / lebenslauf / jobPosting / answers / letterText in client memory | accept | React memory only; RESET → `initialState` (`page.tsx:80`); no localStorage/sessionStorage/server persistence | closed |
| T-02-04 | Information disclosure | `ANTHROPIC_API_KEY` | mitigate | Referenced only server-side via `process.env` (`anthropic.ts:14`); absent from client + route | closed |
| T-02-05 | Tampering (XSS) | Post-stream letter render (editable textarea) + trust callout | mitigate | Controlled `<textarea value={letterText}>` (`page.tsx:758-768`); static `<p>` callout; no `dangerouslySetInnerHTML` | closed |
| T-02-06 | Information disclosure | `.txt` download (Blob) + clipboard | accept | Client-side `Blob`/`URL.createObjectURL`/`revokeObjectURL` (`page.tsx:736-742`) + `navigator.clipboard` (`:726`); no server round-trip | closed |
| T-02-07 | Information disclosure | letterText / jobPosting / answers in client memory | accept | Local `useState`/reducer; cleared by RESET; no persistent storage or server logging introduced | closed |
| T-02-SC | Tampering (supply chain) | npm installs | mitigate | Zero new packages this phase (`package.json` baseline: `@anthropic-ai/sdk`, `next`, `react`, `react-dom`, `zod`); download/copy are browser-native | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-03 | PII (resumeText, lebenslauf, jobPosting, answers) lives in React component memory only; RESET clears all state; no localStorage/sessionStorage/server persistence. Consistent with the zero-retention GDPR positioning. Data never leaves the device except via the user's own API call. Verified: no browser-storage writes in `page.tsx`. | Kilian Hartmann | 2026-06-22 |
| AR-02-02 | T-02-06 | Blob download and clipboard write are client-side operations on content the user already holds. No new network egress, no server persistence. Verified: no server fetch outside `/api/*`. | Kilian Hartmann | 2026-06-22 |
| AR-02-03 | T-02-07 | letterText/jobPosting/answers in `useState`/`useReducer`; RESET dispatches `initialState`; no persistent storage or server-side logging introduced this phase. Verified: localStorage/sessionStorage absent from `page.tsx`. | Kilian Hartmann | 2026-06-22 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-22 | 8 | 8 | 0 | gsd-security-auditor (sonnet) |

---

## Notes

- `dangerouslySetInnerHTML` appears as text in two XSS-guard comments in `page.tsx`. These are intentional security documentation — no actual JSX attribute usage exists (confirmed by grep filtering comment lines).
- `PARSE_MODEL = "claude-haiku-4-5"` is a known, user-deferred model-quality/cost item (CR-01 in `02-REVIEW.md`). It is out of scope for this threat register (not a security threat).
- All accepted risks are consistent with the project's zero-retention GDPR positioning in CLAUDE.md.
- All three SUMMARY.md threat flags (02-01: xss → T-02-01; 02-02: xss_mitigated → T-02-05, client_fs_access → T-02-06) map to registered threats. No unregistered threat surface detected.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-22
