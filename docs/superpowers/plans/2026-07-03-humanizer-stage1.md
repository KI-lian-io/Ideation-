# Humanizer+ Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the account-less €2.99 Humanizer+ refinement purchase (Stripe Payment Element, stateless Stripe-as-token-store), plus legally required Impressum/Datenschutz/AGB pages and Gehaltsvorstellung/Eintrittstermin handling in the cover-letter flow.

**Architecture:** No database, no cookies for anonymous users. Payment via Stripe PaymentIntent created server-side; the client confirms in an embedded Payment Element modal (no redirect, `allow_redirects: 'never'`); `/api/humanize` verifies the PaymentIntent with the Stripe SDK, streams a refined letter using the existing Anthropic streaming pattern, and marks the PI `metadata.consumed=true` only after a successful complete stream (so failed streams are retryable). Stripe itself is the single-use token store.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, `@anthropic-ai/sdk` (existing), `stripe` (server SDK, new), `@stripe/stripe-js` + `@stripe/react-stripe-js` (client, new), Node built-in test runner (`node:test`, existing pattern).

**Spec:** `docs/superpowers/specs/2026-07-03-monetization-humanizer-design.md`

## Global Constraints

- All user-facing copy in the tool is German (existing convention; some helper prose is English — match whichever the surrounding view uses).
- NEVER log letter content, CV content, or answers server-side (existing no-rejected-content-logging rule extends to all new routes).
- Grounded-only: the refinement prompt must forbid adding facts. No detection-evasion language anywhere — not in prompts, code comments, or UI copy. Banned framing: "AI detection", "undetectable", "bypass".
- Anonymous flow stays cookie-free: Stripe.js must load ONLY when the Humanizer modal opens (dynamic import), never on page load.
- New dependencies limited to exactly: `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`. Nothing else.
- Node >= 20.9 (`engines` already pinned). Working dir for all commands: `scanready/`.
- After every task: `npx tsc --noEmit` must pass with zero errors.
- Price: `HUMANIZER_PRICE_CENTS = 299` (EUR). Pay button label must be exactly "Zahlungspflichtig bestellen" (§312j BGB).
- Design system: use existing primitives from `src/components/ui.tsx` (`btnClass`, `CARD`, `EYEBROW`, `NORM_NOTE`). 6px button corners, 12px cards, no new colors.
- Git: commit after each task with the message given in the task. Do NOT push (push needs `gh auth switch --user KI-lian-io`; the orchestrator handles pushes).

---

### Task 1: Legal pages (Impressum, Datenschutz, AGB) + footer

Legally required today (§5 DDG, GDPR Art. 13) and a hard precondition for taking payments. Founder identity data lives in one constants file the founder fills; pages render from it.

**Files:**
- Create: `src/lib/legal-data.ts`
- Create: `src/app/impressum/page.tsx`
- Create: `src/app/datenschutz/page.tsx`
- Create: `src/app/agb/page.tsx`
- Modify: `src/app/layout.tsx` (add footer inside `<body>`)

**Interfaces:**
- Produces: `LEGAL` const (founder data) consumed by all three pages; routes `/impressum`, `/datenschutz`, `/agb` linked from Task 5's modal.

- [ ] **Step 1: Create the founder-data constants file**

```ts
// src/lib/legal-data.ts
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
```

- [ ] **Step 2: Create the Impressum page**

```tsx
// src/app/impressum/page.tsx
import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal-data";

export const metadata: Metadata = { title: "Impressum — ScanReady" };

export default function ImpressumPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold text-ink">Impressum</h1>
      <section className="flex flex-col gap-1 text-sm text-ink">
        <p className="font-semibold">Angaben gemäß § 5 DDG</p>
        <p>{LEGAL.operatorName}</p>
        <p>{LEGAL.street}</p>
        <p>{LEGAL.city}</p>
        <p>{LEGAL.country}</p>
      </section>
      <section className="flex flex-col gap-1 text-sm text-ink">
        <p className="font-semibold">Kontakt</p>
        <p>
          E-Mail: <a className="underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </p>
      </section>
      <section className="flex flex-col gap-1 text-sm text-ink">
        <p className="font-semibold">Umsatzsteuer</p>
        <p>{LEGAL.vatLine}</p>
      </section>
      <section className="flex flex-col gap-1 text-sm text-muted">
        <p className="font-semibold text-ink">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</p>
        <p>{LEGAL.operatorName}, Anschrift wie oben.</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Create the Datenschutzerklärung page**

```tsx
// src/app/datenschutz/page.tsx
import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal-data";

export const metadata: Metadata = { title: "Datenschutzerklärung — ScanReady" };

/**
 * GDPR Art. 13 notice. Structure mirrors what the product actually does:
 * transient processing only, no storage, no accounts, no analytics cookies.
 * FOUNDER ACTION: have this reviewed before go-live (see docs/humanizer-golive.md).
 */
export default function DatenschutzPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-6 text-sm text-ink leading-relaxed">
      <h1 className="font-serif text-3xl font-semibold">Datenschutzerklärung</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">1. Verantwortlicher</h2>
        <p>
          {LEGAL.operatorName}, {LEGAL.street}, {LEGAL.city}, {LEGAL.country} —{" "}
          <a className="underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">2. Verarbeitung Ihrer Lebenslauf-Daten</h2>
        <p>
          Texte, die Sie in das Tool eingeben (Lebenslauf, Stellenanzeige, Antworten), werden
          ausschließlich zur Erstellung Ihrer Dokumente verarbeitet und{" "}
          <strong>nicht gespeichert</strong>. Es gibt keine Konten und keine Datenbank. Die
          Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung:
          Erbringung des von Ihnen angeforderten Dienstes).
        </p>
        <p>
          Zur Texterstellung übermitteln wir Ihre Eingaben an die Anthropic API (Anthropic PBC).
          Anthropic verwendet API-Eingaben nicht zum Training von Modellen. Hosting erfolgt bei
          Vercel Inc.; dabei fallen technisch notwendige Server-Logs (z.&nbsp;B. IP-Adresse) an
          (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">3. Cookies</h2>
        <p>
          Bei normaler Nutzung setzt diese Website <strong>keine Cookies</strong>. Erst wenn Sie
          eine kostenpflichtige Funktion (Humanizer+) nutzen, wird der Zahlungsdienstleister
          Stripe geladen, der technisch notwendige Cookies zur Betrugsprävention setzt
          (Art. 6 Abs. 1 lit. b und f DSGVO).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">4. Zahlungsabwicklung (Stripe)</h2>
        <p>
          Kostenpflichtige Funktionen werden über Stripe Payments Europe, Ltd. abgewickelt. Ihre
          Zahlungsdaten werden direkt von Stripe verarbeitet; wir erhalten und speichern keine
          Kartendaten. Details: Datenschutzerklärung von Stripe (stripe.com/de/privacy).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">5. Ihre Rechte</h2>
        <p>
          Sie haben die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht
          auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO). Da wir Ihre Dokumentdaten
          nicht speichern, liegen nach Abschluss Ihrer Sitzung in der Regel keine
          personenbezogenen Dokumentdaten mehr vor.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Create the AGB/Widerruf page**

```tsx
// src/app/agb/page.tsx
import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal-data";

export const metadata: Metadata = { title: "AGB & Widerrufsbelehrung — ScanReady" };

/**
 * Minimal AGB for the single paid feature (Humanizer+ one-shot refinement).
 * FOUNDER ACTION: legal review before go-live (see docs/humanizer-golive.md).
 */
export default function AgbPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-6 text-sm text-ink leading-relaxed">
      <h1 className="font-serif text-3xl font-semibold">AGB &amp; Widerrufsbelehrung</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">1. Geltungsbereich und Anbieter</h2>
        <p>
          Diese Bedingungen gelten für die kostenpflichtige Funktion „Humanizer+" auf ScanReady.
          Anbieter: {LEGAL.operatorName}, {LEGAL.street}, {LEGAL.city}.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">2. Leistung und Preis</h2>
        <p>
          Humanizer+ erstellt einmalig eine stilistisch überarbeitete Fassung Ihres bereits
          generierten Anschreibens in der von Ihnen gewählten Richtung. Preis: 2,99&nbsp;€
          (Endpreis). Die Leistung wird unmittelbar nach Zahlung erbracht. Es entsteht kein
          Abonnement; es erfolgen keine wiederkehrenden Abbuchungen.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">3. Widerrufsbelehrung</h2>
        <p>
          Verbrauchern steht grundsätzlich ein 14-tägiges Widerrufsrecht zu. Bei digitalen
          Inhalten erlischt das Widerrufsrecht gemäß § 356 Abs. 5 BGB, wenn Sie ausdrücklich
          zugestimmt haben, dass wir vor Ablauf der Widerrufsfrist mit der Ausführung beginnen,
          und Sie Ihre Kenntnis vom Erlöschen des Widerrufsrechts bestätigt haben. Diese
          Zustimmung holen wir vor der Zahlung per Checkbox ein.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">4. Gewährleistung und Haftung</h2>
        <p>
          Die Überarbeitung basiert ausschließlich auf Ihrem eigenen Text; für den Erfolg einer
          Bewerbung wird keine Gewähr übernommen. Bitte lassen Sie das Ergebnis vor dem Versand
          von einem Muttersprachler prüfen. Schlägt die Erstellung nach erfolgreicher Zahlung
          dauerhaft fehl, erstatten wir den Kaufpreis — Kontakt:{" "}
          <a className="underline" href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Add the footer to the root layout**

In `src/app/layout.tsx`, replace the `<body>` line:

```tsx
      <body className="min-h-full flex flex-col">{children}</body>
```

with:

```tsx
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto border-t border-hair px-6 py-6">
          <nav className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <a className="hover:text-ink transition-colors" href="/impressum">Impressum</a>
            <a className="hover:text-ink transition-colors" href="/datenschutz">Datenschutz</a>
            <a className="hover:text-ink transition-colors" href="/agb">AGB &amp; Widerruf</a>
          </nav>
        </footer>
      </body>
```

Note: `border-hair`, `text-muted`, `text-ink` are existing theme tokens (see `globals.css` `@theme`) — do not invent new ones. If `border-hair` is not the exact token name, grep `globals.css` for the hairline token used by `CARD` in `ui.tsx` and use that.

- [ ] **Step 6: Verify build and routes**

Run: `npx tsc --noEmit` — Expected: no errors.
Run: `npm run dev`, open `http://localhost:3000/impressum`, `/datenschutz`, `/agb` — Expected: all three render with the founder-TODO values visible; footer links appear on `/` and `/app`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/legal-data.ts src/app/impressum/page.tsx src/app/datenschutz/page.tsx src/app/agb/page.tsx src/app/layout.tsx
git commit -m "feat(legal): Impressum, Datenschutz, AGB pages + footer (§5 DDG / GDPR Art. 13)"
```

---

### Task 2: Gehaltsvorstellung / Eintrittstermin conditional questions

German postings routinely require salary expectation and earliest start date in the Anschreiben. Detect the request in the pasted posting, append conditional questions, and instruct the letter prompt to address them — grounded, never invented.

**Files:**
- Modify: `src/lib/prompts.ts`
- Create: `src/lib/__tests__/prompts.test.ts`
- Modify: `src/app/app/page.tsx` (reducer `SET_JOB_POSTING` case, line ~310)
- Modify: `package.json` (test script)

**Interfaces:**
- Produces: `questionsForPosting(jobPosting: string): string[]` — returns `PERSONALIZATION_QUESTIONS` plus 0–2 conditional questions. Consumed by the reducer.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/prompts.test.ts
/**
 * Behavior tests for questionsForPosting (conditional Gehalt/Eintrittstermin questions).
 * Run: node --experimental-strip-types --test src/lib/__tests__/prompts.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { questionsForPosting, PERSONALIZATION_QUESTIONS, SALARY_QUESTION, START_DATE_QUESTION } from '../prompts.ts'

test('plain posting returns only the base questions', () => {
  const qs = questionsForPosting('Wir suchen eine:n Frontend-Entwickler:in in Berlin.')
  assert.deepEqual(qs, PERSONALIZATION_QUESTIONS)
})

test('posting asking for Gehaltsvorstellung appends the salary question', () => {
  const qs = questionsForPosting('Bitte senden Sie uns Ihre Bewerbung mit Gehaltsvorstellung.')
  assert.equal(qs.length, PERSONALIZATION_QUESTIONS.length + 1)
  assert.equal(qs[qs.length - 1], SALARY_QUESTION)
})

test('posting asking for salary expectation in English appends the salary question', () => {
  const qs = questionsForPosting('Please include your salary expectation in the cover letter.')
  assert.ok(qs.includes(SALARY_QUESTION))
})

test('posting asking for Eintrittstermin appends the start-date question', () => {
  const qs = questionsForPosting('Bitte nennen Sie Ihren frühestmöglichen Eintrittstermin.')
  assert.ok(qs.includes(START_DATE_QUESTION))
})

test('posting asking for both appends both, salary first', () => {
  const qs = questionsForPosting('Mit Gehaltsvorstellung und frühestmöglichem Eintrittstermin.')
  assert.deepEqual(qs.slice(-2), [SALARY_QUESTION, START_DATE_QUESTION])
})

test('matching is case-insensitive', () => {
  const qs = questionsForPosting('GEHALTSVORSTELLUNG erwünscht')
  assert.ok(qs.includes(SALARY_QUESTION))
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --experimental-strip-types --test src/lib/__tests__/prompts.test.ts`
Expected: FAIL — `questionsForPosting` / `SALARY_QUESTION` not exported.

- [ ] **Step 3: Implement in prompts.ts**

Append to `src/lib/prompts.ts` (after `PERSONALIZATION_QUESTIONS`):

```ts
/** Conditional questions appended when the posting explicitly asks for these (German norm). */
export const SALARY_QUESTION =
  'This posting asks for a salary expectation (Gehaltsvorstellung). What gross annual figure or range do you want to state? (e.g. "55.000–60.000 € brutto/Jahr")';
export const START_DATE_QUESTION =
  'This posting asks for your earliest start date (Eintrittstermin). When can you start? (e.g. "zum 01.09.2026" or "ab sofort")';

const SALARY_RE = /gehaltsvorstellung|gehaltswunsch|salary expectation|desired salary/i;
const START_DATE_RE =
  /eintrittstermin|eintrittsdatum|frühestmöglich|starting date|earliest start|start date/i;

/**
 * Base questions plus conditionals the posting explicitly requests.
 * Pure function — the reducer re-syncs the answers array off this on every
 * posting change, preserving answers by question identity.
 */
export function questionsForPosting(jobPosting: string): string[] {
  const qs = [...PERSONALIZATION_QUESTIONS];
  if (SALARY_RE.test(jobPosting)) qs.push(SALARY_QUESTION);
  if (START_DATE_RE.test(jobPosting)) qs.push(START_DATE_QUESTION);
  return qs;
}
```

Also add one line to `COVER_LETTER_SYSTEM`, in the `GERMAN ANSCHREIBEN NORMS:` block after the `close (availability, ...)` line:

```
- If the applicant's answers state a salary expectation (Gehaltsvorstellung) or an earliest
  start date (Eintrittstermin), state them plainly in the closing paragraph, German-convention
  phrasing (e.g. "Meine Gehaltsvorstellung liegt bei ...", "Ein Eintritt ist zum ... möglich").
  If the answers do not provide them, do NOT mention or invent them.
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --experimental-strip-types --test src/lib/__tests__/prompts.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Wire the reducer**

In `src/app/app/page.tsx`:

1. Extend the prompts import (top of file) to include `questionsForPosting`.
2. Replace the `SET_JOB_POSTING` case (~line 310):

```ts
    case 'SET_JOB_POSTING': {
      // Re-derive the question list from the posting (conditional Gehalt/Eintrittstermin
      // questions) and sync answers by question identity so typed answers survive.
      const questions = questionsForPosting(action.payload)
      const answers = questions.map(
        (q) => state.answers.find((a) => a.question === q) ?? { question: q, answer: '' }
      )
      return { ...state, jobPosting: action.payload, answers }
    }
```

No changes needed in `CoverLetterInputView` — it already maps over `answers`, so the extra questions appear as the user pastes a posting that requests them.

- [ ] **Step 6: Update the package.json test script to run all test files**

```json
    "test": "node --experimental-strip-types --test src/lib/__tests__/lebenslauf-utils.test.ts src/lib/__tests__/prompts.test.ts"
```

Run: `npm test` — Expected: all tests pass (existing + new).
Run: `npx tsc --noEmit` — Expected: no errors.

- [ ] **Step 7: Manual check**

`npm run dev` → `/app` → paste any CV → parse → cover letter step → paste a posting containing "Gehaltsvorstellung": the salary question appears as a 6th question. Remove the word: the question (and any typed answer for it) disappears.

- [ ] **Step 8: Commit**

```bash
git add src/lib/prompts.ts src/lib/__tests__/prompts.test.ts src/app/app/page.tsx package.json
git commit -m "feat(letter): conditional Gehaltsvorstellung/Eintrittstermin questions + prompt support"
```

---

### Task 3: Stripe server foundation — SDK, verification helper, intent route

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/lib/humanizer.ts`
- Create: `src/lib/__tests__/humanizer.test.ts`
- Create: `src/app/api/humanizer/intent/route.ts`
- Modify: `.env.example` (add Stripe keys)
- Modify: `package.json` (test script; dependency added via npm install)

**Interfaces:**
- Produces: `HUMANIZER_PRICE_CENTS = 299`; `checkHumanizerPi(pi: PaymentIntentLike): PiCheck` where `PiCheck = { ok: true } | { ok: false; reason: 'not_paid' | 'consumed' | 'wrong_feature' }`; `stripe` singleton (server-only); `POST /api/humanizer/intent` → `{ clientSecret: string }`. Consumed by Task 4 (verification) and Task 5 (client secret).

- [ ] **Step 1: Install the server SDK**

Run: `npm install stripe`
Expected: added to `dependencies` in `package.json`.

- [ ] **Step 2: Write the failing test for the verification helper**

```ts
// src/lib/__tests__/humanizer.test.ts
/**
 * Behavior tests for checkHumanizerPi — pure PaymentIntent gate logic.
 * Run: node --experimental-strip-types --test src/lib/__tests__/humanizer.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { checkHumanizerPi, type PaymentIntentLike } from '../humanizer.ts'

function pi(overrides: Partial<PaymentIntentLike> = {}): PaymentIntentLike {
  return {
    id: 'pi_test',
    status: 'succeeded',
    metadata: { feature: 'humanizer' },
    ...overrides,
  }
}

test('succeeded + humanizer + unconsumed → ok', () => {
  assert.deepEqual(checkHumanizerPi(pi()), { ok: true })
})

test('unpaid PI → not_paid', () => {
  assert.deepEqual(checkHumanizerPi(pi({ status: 'requires_payment_method' })), {
    ok: false,
    reason: 'not_paid',
  })
})

test('already consumed → consumed', () => {
  assert.deepEqual(
    checkHumanizerPi(pi({ metadata: { feature: 'humanizer', consumed: 'true' } })),
    { ok: false, reason: 'consumed' }
  )
})

test('PI for a different feature → wrong_feature', () => {
  assert.deepEqual(checkHumanizerPi(pi({ metadata: { feature: 'other' } })), {
    ok: false,
    reason: 'wrong_feature',
  })
})

test('missing feature metadata → wrong_feature', () => {
  assert.deepEqual(checkHumanizerPi(pi({ metadata: {} })), {
    ok: false,
    reason: 'wrong_feature',
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --experimental-strip-types --test src/lib/__tests__/humanizer.test.ts`
Expected: FAIL — module `../humanizer.ts` not found.

- [ ] **Step 4: Implement the helper**

```ts
// src/lib/humanizer.ts
/**
 * Humanizer+ payment gate. Stripe is the single-use token store: a PaymentIntent
 * is usable iff it succeeded, was created for this feature, and hasn't been
 * marked consumed. Pure logic here (testable); Stripe I/O stays in the routes.
 */

export const HUMANIZER_PRICE_CENTS = 299;

export type PaymentIntentLike = {
  id: string;
  status: string;
  metadata: Partial<Record<string, string>>;
};

export type PiCheck =
  | { ok: true }
  | { ok: false; reason: 'not_paid' | 'consumed' | 'wrong_feature' };

export function checkHumanizerPi(pi: PaymentIntentLike): PiCheck {
  if (pi.metadata.feature !== 'humanizer') return { ok: false, reason: 'wrong_feature' };
  if (pi.status !== 'succeeded') return { ok: false, reason: 'not_paid' };
  if (pi.metadata.consumed === 'true') return { ok: false, reason: 'consumed' };
  return { ok: true };
}
```

Note the order: `wrong_feature` is checked first so a foreign PI never leaks payment-status information.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --experimental-strip-types --test src/lib/__tests__/humanizer.test.ts`
Expected: 5 passing.

- [ ] **Step 6: Create the Stripe singleton**

```ts
// src/lib/stripe.ts
import Stripe from "stripe";

/**
 * Server-only Stripe client. Mirrors the anthropic.ts singleton pattern.
 * STRIPE_SECRET_KEY comes from .env.local / Vercel env.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
```

- [ ] **Step 7: Create the intent route**

```ts
// src/app/api/humanizer/intent/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { HUMANIZER_PRICE_CENTS } from "@/lib/humanizer";

export const runtime = "nodejs";

/**
 * POST /api/humanizer/intent → { clientSecret }
 * Creates the €2.99 PaymentIntent for one Humanizer+ refinement. Stateless:
 * no body, no user data. allow_redirects: 'never' keeps the whole payment
 * inside the embedded Payment Element (the letter lives only in client memory).
 */
export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Zahlungen sind derzeit nicht verfügbar." },
      { status: 503 }
    );
  }
  try {
    const pi = await stripe.paymentIntents.create({
      amount: HUMANIZER_PRICE_CENTS,
      currency: "eur",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { feature: "humanizer" },
    });
    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (err) {
    console.error("humanizer intent error", err); // Stripe error only — never user content
    return NextResponse.json(
      { error: "Zahlung konnte nicht initialisiert werden. Bitte später erneut versuchen." },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 8: Add env vars, update test script, verify**

Append to `.env.example`:

```
# Stripe (Humanizer+). Test keys from dashboard.stripe.com → Developers → API keys.
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Update `package.json` test script:

```json
    "test": "node --experimental-strip-types --test src/lib/__tests__/lebenslauf-utils.test.ts src/lib/__tests__/prompts.test.ts src/lib/__tests__/humanizer.test.ts"
```

Run: `npm test` — Expected: all pass.
Run: `npx tsc --noEmit` — Expected: no errors.
Run (with test keys in `.env.local`): `npm run dev`, then `curl -X POST http://localhost:3000/api/humanizer/intent` — Expected: `{"clientSecret":"pi_..._secret_..."}`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/stripe.ts src/lib/humanizer.ts src/lib/__tests__/humanizer.test.ts src/app/api/humanizer/intent/route.ts .env.example package.json package-lock.json
git commit -m "feat(humanizer): Stripe foundation — PI verification helper + intent route"
```

---

### Task 4: Refinement prompt + /api/humanize streaming route

**Files:**
- Modify: `src/lib/prompts.ts` (add Humanizer prompt builders)
- Modify: `src/lib/__tests__/prompts.test.ts` (add direction tests)
- Create: `src/app/api/humanize/route.ts`

**Interfaces:**
- Consumes: `stripe` singleton, `checkHumanizerPi` (Task 3).
- Produces: `HUMANIZER_DIRECTIONS` (`Record<'formeller'|'moderner'|'praegnanter', string>`), `HumanizerDirection` type, `HUMANIZER_SYSTEM`, `buildHumanizerUser(letterText: string, direction: HumanizerDirection): string`; `POST /api/humanize` `{ letterText, direction, paymentIntentId }` → text/plain stream. Consumed by Task 5.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/prompts.test.ts`:

```ts
import { HUMANIZER_DIRECTIONS, buildHumanizerUser, HUMANIZER_SYSTEM } from '../prompts.ts'

test('humanizer has exactly the three directions', () => {
  assert.deepEqual(Object.keys(HUMANIZER_DIRECTIONS).sort(), ['formeller', 'moderner', 'praegnanter'])
})

test('buildHumanizerUser embeds the letter and the chosen direction text', () => {
  const out = buildHumanizerUser('Sehr geehrte Damen und Herren, ...', 'formeller')
  assert.ok(out.includes('Sehr geehrte Damen und Herren'))
  assert.ok(out.includes(HUMANIZER_DIRECTIONS.formeller))
})

test('humanizer system prompt forbids adding facts and contains no detection-evasion framing', () => {
  assert.ok(/never add facts|Never add facts/i.test(HUMANIZER_SYSTEM))
  assert.ok(!/detect/i.test(HUMANIZER_SYSTEM))
})
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `node --experimental-strip-types --test src/lib/__tests__/prompts.test.ts`
Expected: prior tests pass, 3 new FAIL (exports missing).

- [ ] **Step 3: Implement the prompt builders**

Append to `src/lib/prompts.ts`:

```ts
// ---------------------------------------------------------------------------
// Humanizer+ — grounded style refinement (Feinschliff). NOT a rewrite, NOT
// detection-evasion: rephrase only what is present; never add facts.
// ---------------------------------------------------------------------------

export const HUMANIZER_DIRECTIONS = {
  formeller:
    "Tune the register toward a traditional Konzern/Mittelstand application: more formal phrasing, conservative sentence structure, classical courtesy formulas.",
  moderner:
    "Tune the register toward a startup/scale-up: direct, energetic, shorter sentences, less ceremonial — while staying professional German (Sie-Form).",
  praegnanter:
    "Tighten the letter: remove redundancy and filler, merge overlapping sentences, make it noticeably shorter while preserving every fact and the applicant's voice.",
} as const;

export type HumanizerDirection = keyof typeof HUMANIZER_DIRECTIONS;

export const HUMANIZER_SYSTEM = `You refine an existing German Anschreiben the applicant already has. This is a style refinement (Feinschliff), NOT a rewrite.

GROUNDING — non-negotiable:
- Preserve every factual claim exactly: employers, numbers, dates, qualifications, the company, the role, salary figures, start dates. Never add facts, achievements, or qualifications that are not in the input letter.
- Preserve the applicant's personal motivations and specific wording where they carry voice.

RULES:
- Keep the DIN-5008 business-letter structure and one-page length.
- Formal German (Sie-Form). No English-style hype, no clichés.
- Apply exactly the refinement direction given in the user message.
- Output only the refined letter. No preamble, no explanations.`;

export function buildHumanizerUser(letterText: string, direction: HumanizerDirection): string {
  return `REFINEMENT DIRECTION:\n${HUMANIZER_DIRECTIONS[direction]}\n\n---LETTER---\n${letterText}\n---END---\n\nWrite the refined Anschreiben now.`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --experimental-strip-types --test src/lib/__tests__/prompts.test.ts`
Expected: all passing.

- [ ] **Step 5: Create the /api/humanize route**

```ts
// src/app/api/humanize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { anthropic, GENERATION_MODEL } from "@/lib/anthropic";
import { stripe } from "@/lib/stripe";
import { checkHumanizerPi } from "@/lib/humanizer";
import {
  HUMANIZER_SYSTEM,
  HUMANIZER_DIRECTIONS,
  buildHumanizerUser,
  type HumanizerDirection,
} from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/humanize
 *   { letterText: string, direction: 'formeller'|'moderner'|'praegnanter', paymentIntentId: string }
 * Verifies the paid, unconsumed PaymentIntent, streams the refined letter, then marks
 * the PI consumed. Consumed is set only AFTER a complete stream so failures are
 * retryable; the metadata update is not atomic — a deliberate double-submit can get
 * two refinements for one payment (accepted: costs ~cents, spec D8).
 */
export async function POST(req: NextRequest) {
  const { letterText, direction, paymentIntentId } = await req.json();

  if (!letterText || typeof letterText !== "string" || typeof paymentIntentId !== "string" || !(direction in HUMANIZER_DIRECTIONS)) {
    return NextResponse.json(
      { error: "letterText, direction und paymentIntentId sind erforderlich." },
      { status: 400 }
    );
  }
  const LETTER_LIMIT = 10_000;
  if (letterText.length > LETTER_LIMIT) {
    return NextResponse.json(
      { error: "Das Anschreiben ist zu lang (max. 10.000 Zeichen)." },
      { status: 400 }
    );
  }

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    return NextResponse.json(
      { error: "Zahlung konnte nicht überprüft werden. Bitte erneut versuchen." },
      { status: 502 }
    );
  }
  const check = checkHumanizerPi(pi);
  if (!check.ok) {
    const messages: Record<string, string> = {
      not_paid: "Die Zahlung ist noch nicht abgeschlossen.",
      consumed: "Diese Zahlung wurde bereits eingelöst.",
      wrong_feature: "Ungültige Zahlungsreferenz.",
    };
    return NextResponse.json({ error: messages[check.reason] }, { status: 402 });
  }

  const stream = anthropic.messages.stream({
    model: GENERATION_MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: HUMANIZER_SYSTEM,
    messages: [
      { role: "user", content: buildHumanizerUser(letterText, direction as HumanizerDirection) },
    ],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("humanize stream error", err); // never letter content
        controller.error(err);
        return; // PI stays unconsumed → client may retry
      }
      // Mark consumed only after a full successful stream.
      try {
        await stripe.paymentIntents.update(paymentIntentId, {
          metadata: { feature: "humanizer", consumed: "true" },
        });
      } catch (err) {
        console.error("humanize consume-mark error", err); // user got their letter; worst case a free retry window
      }
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit` — Expected: no errors.
Run: `npm test` — Expected: all pass.
Manual (with test keys): create an intent via curl (Task 3 step 8), pay it in Stripe test mode is not possible via curl alone — full E2E happens in Task 5. For now verify the 402 path: `curl -X POST http://localhost:3000/api/humanize -H 'Content-Type: application/json' -d '{"letterText":"Sehr geehrte...","direction":"formeller","paymentIntentId":"<pi_id_from_intent_call>"}'` — Expected: `{"error":"Die Zahlung ist noch nicht abgeschlossen."}` with status 402.

- [ ] **Step 7: Commit**

```bash
git add src/lib/prompts.ts src/lib/__tests__/prompts.test.ts src/app/api/humanize/route.ts
git commit -m "feat(humanizer): grounded refinement prompt + verified streaming /api/humanize route"
```

---

### Task 5: Client — Humanizer modal (Payment Element) + result-view wiring

**Files:**
- Create: `src/components/HumanizerModal.tsx`
- Modify: `src/app/app/page.tsx` (`CoverLetterResultView`, ~lines 732–849)

**Interfaces:**
- Consumes: `POST /api/humanizer/intent` → `{ clientSecret }`; `POST /api/humanize` (Task 4); `HUMANIZER_DIRECTIONS`, `HumanizerDirection` from `@/lib/prompts`; `btnClass`, `EYEBROW`, `CARD` from `@/components/ui`.
- Produces: `<HumanizerModal open onClose onDone(refinedText: string) letterText />`.

- [ ] **Step 1: Install the client Stripe packages**

Run: `npm install @stripe/stripe-js @stripe/react-stripe-js`

- [ ] **Step 2: Create the modal component**

```tsx
// src/components/HumanizerModal.tsx
'use client'

/**
 * Humanizer+ purchase + refinement modal. Loaded via next/dynamic from the page
 * so Stripe.js (which sets fraud-prevention cookies) is only fetched when the
 * user opens the modal — anonymous browsing stays cookie-free.
 *
 * Steps: direction → payment (Widerruf checkbox + Payment Element) → refining (stream).
 * No redirect: allow_redirects: 'never' on the PI + redirect: 'if_required' here.
 */
import { useState, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { HUMANIZER_DIRECTIONS, type HumanizerDirection } from '@/lib/prompts'
import { btnClass, EYEBROW } from '@/components/ui'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

const DIRECTION_LABELS: Record<HumanizerDirection, { title: string; blurb: string }> = {
  formeller: { title: 'Formeller', blurb: 'Konzern & Mittelstand — klassisch, konservativ, korrekt.' },
  moderner: { title: 'Moderner', blurb: 'Startup & Scale-up — direkt, energisch, ohne Zeremonie.' },
  praegnanter: { title: 'Prägnanter', blurb: 'Kürzen & verdichten — jede Zeile verdient ihren Platz.' },
}

type Step = 'direction' | 'payment' | 'refining' | 'error'

export default function HumanizerModal({
  open,
  letterText,
  onClose,
  onDone,
}: {
  open: boolean
  letterText: string
  onClose: () => void
  onDone: (refined: string) => void
}) {
  const [step, setStep] = useState<Step>('direction')
  const [direction, setDirection] = useState<HumanizerDirection | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const paymentIntentIdRef = useRef<string | null>(null)
  const [failCount, setFailCount] = useState(0)

  if (!open) return null

  async function pickDirection(d: HumanizerDirection) {
    setDirection(d)
    setError(null)
    try {
      const res = await fetch('/api/humanizer/intent', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.clientSecret) throw new Error(data.error ?? 'intent failed')
      setClientSecret(data.clientSecret)
      setStep('payment')
    } catch {
      setError('Zahlung konnte nicht initialisiert werden. Bitte später erneut versuchen.')
    }
  }

  async function runRefinement(piId: string) {
    paymentIntentIdRef.current = piId
    setStep('refining')
    setError(null)
    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letterText, direction, paymentIntentId: piId }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Verfeinerung fehlgeschlagen.')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let refined = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        refined += decoder.decode(value, { stream: true })
      }
      if (!refined.trim()) throw new Error('Leere Antwort.')
      onDone(refined)
    } catch (e) {
      setFailCount((n) => n + 1)
      setError(e instanceof Error ? e.message : 'Verfeinerung fehlgeschlagen.')
      setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label="Humanizer+ Feinschliff">
      <div className="w-full max-w-lg rounded-xl border border-hair bg-paper p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className={EYEBROW}>Humanizer+</p>
            <h2 className="font-serif text-2xl font-semibold text-ink">Feinschliff — 2,99&nbsp;€</h2>
          </div>
          <button onClick={onClose} aria-label="Schließen" className="text-muted hover:text-ink text-xl leading-none">×</button>
        </div>

        {step === 'direction' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Ihr Anschreiben ist fertig. Der Feinschliff passt Ton und Register an die Kultur des
              Unternehmens an — Ihre Fakten und Ihre Stimme bleiben unverändert.
            </p>
            {(Object.keys(DIRECTION_LABELS) as HumanizerDirection[]).map((d) => (
              <button
                key={d}
                onClick={() => pickDirection(d)}
                className="rounded-xl border border-hair bg-card p-4 text-left transition-colors hover:border-accent"
              >
                <p className="font-semibold text-ink">{DIRECTION_LABELS[d].title}</p>
                <p className="text-sm text-muted">{DIRECTION_LABELS[d].blurb}</p>
              </button>
            ))}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {step === 'payment' && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm onPaid={runRefinement} error={error} setError={setError} />
          </Elements>
        )}

        {step === 'refining' && (
          <p className="text-sm text-muted animate-pulse">Feinschliff wird erstellt …</p>
        )}

        {step === 'error' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-red-600">{error}</p>
            {failCount < 3 && paymentIntentIdRef.current ? (
              <button className={btnClass('primary')} onClick={() => runRefinement(paymentIntentIdRef.current!)}>
                Erneut versuchen (bereits bezahlt)
              </button>
            ) : (
              <p className="text-sm text-muted">
                Mehrfach fehlgeschlagen? Wir erstatten den Kaufpreis — E-Mail mit der Referenz{' '}
                <code className="font-mono">{paymentIntentIdRef.current}</code> an die im{' '}
                <a className="underline" href="/impressum" target="_blank">Impressum</a> genannte Adresse.
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-muted">
          Einmalzahlung, kein Abo. Es gelten die{' '}
          <a className="underline" href="/agb" target="_blank">AGB &amp; Widerrufsbelehrung</a>.{' '}
          <a className="underline" href="/datenschutz" target="_blank">Datenschutz</a> ·{' '}
          <a className="underline" href="/impressum" target="_blank">Impressum</a>
        </p>
      </div>
    </div>
  )
}

function PaymentForm({
  onPaid,
  error,
  setError,
}: {
  onPaid: (paymentIntentId: string) => void
  error: string | null
  setError: (e: string | null) => void
}) {
  const stripeJs = useStripe()
  const elements = useElements()
  const [widerrufOk, setWiderrufOk] = useState(false)
  const [paying, setPaying] = useState(false)

  async function pay() {
    if (!stripeJs || !elements) return
    setPaying(true)
    setError(null)
    const result = await stripeJs.confirmPayment({ elements, redirect: 'if_required' })
    setPaying(false)
    if (result.error) {
      setError(result.error.message ?? 'Zahlung fehlgeschlagen.')
      return
    }
    if (result.paymentIntent?.status === 'succeeded') {
      onPaid(result.paymentIntent.id)
    } else {
      setError('Zahlung nicht abgeschlossen. Bitte erneut versuchen.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement />
      <label className="flex items-start gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={widerrufOk}
          onChange={(e) => setWiderrufOk(e.target.checked)}
          className="mt-0.5 accent-[var(--color-accent,#0a7d63)]"
        />
        <span>
          Ich verlange ausdrücklich, dass mit der Ausführung vor Ablauf der Widerrufsfrist
          begonnen wird, und bestätige meine Kenntnis, dass mein Widerrufsrecht mit Beginn der
          Ausführung erlischt (§ 356 Abs. 5 BGB).
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={pay}
        disabled={!widerrufOk || paying || !stripeJs || !elements}
        className={btnClass('primary')}
      >
        {paying ? 'Wird verarbeitet …' : 'Zahlungspflichtig bestellen (2,99 €)'}
      </button>
    </div>
  )
}
```

Note: if `btnClass`/`EYEBROW` export names differ, check `src/components/ui.tsx` and match. The checkbox accent uses the theme accent variable; if `--color-accent` has a different name in `globals.css`, use that.

- [ ] **Step 3: Wire the CTA and restore into CoverLetterResultView**

In `src/app/app/page.tsx`:

1. Add at the top of the file with other imports:

```tsx
import dynamic from 'next/dynamic'

// Dynamic: keeps Stripe.js (and its cookies) out of the page until the modal opens.
const HumanizerModal = dynamic(() => import('@/components/HumanizerModal'), { ssr: false })
```

2. Inside `CoverLetterResultView`, add local state after the existing `useState` lines:

```tsx
  const [humanizerOpen, setHumanizerOpen] = useState(false)
  // Pre-refinement letter, kept so the user can restore (null = not refined yet)
  const [originalLetter, setOriginalLetter] = useState<string | null>(null)
```

3. In the action row (`<div className="flex items-center gap-3 flex-wrap">`), add as the FIRST button (before copy):

```tsx
        {/* Humanizer+ upsell — one-shot purchase, additive refinement (spec D1/D3) */}
        <button
          onClick={() => setHumanizerOpen(true)}
          aria-label="Feinschliff mit Humanizer+ kaufen"
          className={btnClass('accent')}
        >
          Feinschliff mit Humanizer+ — 2,99 €
        </button>
```

Note: `btnClass('accent')` — check `ui.tsx` for the accent/emphasis variant name; if the variants are only `'primary' | 'secondary'`, use `'primary'` for this button and downgrade the copy button to `'secondary'`.

4. After the action row, add the restore control:

```tsx
      {originalLetter !== null && (
        <button
          onClick={() => {
            setLetterText(originalLetter)
            setOriginalLetter(null)
          }}
          className={`${btnClass('secondary')} self-start`}
        >
          Original wiederherstellen
        </button>
      )}
```

5. At the end of the returned JSX (inside the outer `<div>`), render the modal:

```tsx
      <HumanizerModal
        open={humanizerOpen}
        letterText={letterText}
        onClose={() => setHumanizerOpen(false)}
        onDone={(refined) => {
          setOriginalLetter((prev) => prev ?? letterText)
          setLetterText(refined)
          setHumanizerOpen(false)
        }}
      />
```

- [ ] **Step 4: Full E2E in Stripe test mode**

With test keys in `.env.local`: `npm run dev` → complete the flow to a finished letter → click "Feinschliff mit Humanizer+" → pick a direction → Payment Element renders → pay button stays disabled until the Widerruf checkbox is checked → pay with test card `4242 4242 4242 4242` (any future expiry, any CVC) → refinement streams → letter is replaced, "Original wiederherstellen" appears and works.
Replay check: re-open the modal, pick a direction, DON'T pay — instead call `/api/humanize` via devtools fetch with the already-consumed PI id — Expected: 402 "Diese Zahlung wurde bereits eingelöst."
Cookie check: fresh incognito session, browse `/` and `/app` WITHOUT opening the modal — Expected: no cookies set (devtools → Application → Cookies).

- [ ] **Step 5: Verify types and tests**

Run: `npx tsc --noEmit` — Expected: no errors.
Run: `npm test` — Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/HumanizerModal.tsx src/app/app/page.tsx package.json package-lock.json
git commit -m "feat(humanizer): purchase modal (Payment Element, Widerruf consent) + result-view wiring"
```

---

### Task 6: Go-live checklist doc

**Files:**
- Create: `docs/humanizer-golive.md`

**Interfaces:** none (founder-facing document).

- [ ] **Step 1: Write the checklist**

```markdown
# Humanizer+ Go-Live Checklist (founder actions)

Code-complete is NOT launch-ready. Every box below must be checked before the
Humanizer+ button ships to production traffic.

## Legal (blocking)
- [ ] Fill real data in `src/lib/legal-data.ts` (name, address, email) — no FOUNDER_TODO left
- [ ] Decide VAT: Kleinunternehmerregelung (§19 UStG) → keep the vatLine; otherwise
      remove it, register for VAT/OSS, and enable Stripe Tax
- [ ] Have Datenschutzerklärung + AGB reviewed (template text ≠ legal advice)
- [ ] Verify the Widerruf checkbox blocks payment when unchecked (manual test)
- [ ] Verify pay button label is exactly "Zahlungspflichtig bestellen (2,99 €)"

## Stripe (blocking)
- [ ] Live keys in Vercel env: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] One real production purchase + refund drill (buy with a real card, refund via dashboard)
- [ ] Stripe email receipts enabled (Settings → Emails → successful payments)
- [ ] Statement descriptor set to something recognizable (e.g. SCANREADY)

## Product
- [ ] Native-speaker review of refined output in all three directions (existing quality gate)
- [ ] Measurement denominator live (PostHog funnel or Vercel Analytics custom events)
      so conversion = purchases / letters_done is computable
- [ ] Landing page copy check: zero-retention claim still accurate (it is — no storage
      was added), but mention that payment uses Stripe

## Rollback
- Unset NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY + STRIPE_SECRET_KEY in Vercel → intent route
  returns 503, modal shows the init error, core free flow unaffected.
```

- [ ] **Step 2: Commit**

```bash
git add docs/humanizer-golive.md
git commit -m "docs(humanizer): go-live checklist (legal, Stripe, measurement, rollback)"
```

---

## Self-Review Notes

- **Spec coverage:** D1 (refinement scope/guardrails → Task 4 prompt + tests), D2/D3 (price/one-shot → Tasks 3–5), D8 (Payment Element no-redirect → Tasks 3+5), legal checklist (Task 1 + 6), Gehalt/Eintrittstermin (Task 2), measurement (Task 6 checklist item — deliberately not built here; spec says recommended-not-blocker), error handling (Task 4 retryable-until-consumed + Task 5 retry UI + refund path), testing section (unit tests Tasks 2–4, Stripe-test-mode E2E Task 5).
- **Known accepted gaps (from spec):** metadata-update race (documented in route comment); measurement implementation deferred to a follow-up decision (PostHog vs Vercel Analytics).
- **Type consistency check:** `HumanizerDirection` defined once in `prompts.ts`, imported by route and modal; `checkHumanizerPi`/`PaymentIntentLike` defined once in `humanizer.ts`; `questionsForPosting` consumed only by the reducer.
