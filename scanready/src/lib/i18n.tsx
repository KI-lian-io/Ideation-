'use client'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

/**
 * UI-chrome language toggle (EN/DE). This governs ONLY interface strings:
 * labels, buttons, error copy, placeholders. It never touches the generated
 * documents (Lebenslauf / Anschreiben), which are always German, or the
 * document-section labels inside LebenslaufEditor (Persönliche Daten, ...),
 * which are fixed German DIN terms regardless of UI language.
 *
 * Persisted to localStorage so a returning visitor keeps their choice.
 * Defaults to 'en' and is read from localStorage only after mount (hydration
 * safety – server and first client render must match).
 */

export type UILang = 'en' | 'de'

const STORAGE_KEY = 'scanready.uiLang'

// ---------------------------------------------------------------------------
// Dictionary shape – `satisfies` on both language objects keeps them in lockstep.
// Parameterized strings are functions so callers can't forget an argument.
// ---------------------------------------------------------------------------

type Dict = {
  // Top bar
  switchLangLabel: string

  // InputView
  inputHeadline: string
  inputIntro: string
  zeroRetention: string
  uploadButton: string
  uploadButtonBusy: string
  uploadHintDefault: string
  uploadHintImported: (filename: string) => string
  uploadGenericError: string
  resumePlaceholder: string
  resumeAriaLabel: string
  tooLongSuffix: string
  submitCta: string

  // LoadingView
  loadingMessages: string[]
  loadingAriaLabel: string

  // StepIndicator
  stepLebenslauf: string
  stepQuestions: string
  stepAnschreiben: string
  stepAriaLabel: (current: number, label: string) => string

  // ResultView
  resultHeadline: string
  normGapsFixed: (n: number) => string
  resultGroundedOnly: string
  writeAnschreibenTitle: string
  writeAnschreibenBody: string
  writeAnschreibenPrice: string
  writeAnschreibenCta: string
  copyLebenslaufAria: string
  copyLebenslauf: string
  copied: string
  copyFailed: string
  copyFailedAria: string
  startOverLink: string
  startOverConfirm: string

  // Print / PDF export (browser print-to-PDF, no server round-trip, no PDF library)
  exportPdfAria: string
  exportPdfCta: string
  exportPdfHint: string
  ortDatumLabel: string

  // ErrorView / JunkView
  errorTitle: string
  errorGeneric: string
  tryAgain: string
  junkTitle: string
  junkBody: string
  junkTip: string
  junkPlaceholder: string

  // CoverLetterInputView
  clHeadline: string
  clIntro: string
  jobPostingLabel: string
  jobPostingPlaceholder: string
  jobPostingAria: string
  questionsIntro: string
  answerAria: (n: number) => string
  answerTooLong: string
  nativeSpeakerNote: string
  submitLetterCta: string
  backToLebenslauf: string

  // CoverLetterStreamingView
  streamingSectionLabel: string
  streamingInProgress: string
  streamingComposing: string
  streamingAriaGenerating: string

  // CoverLetterResultView
  clResultHeadline: string
  clResultSubline: string
  clickToEdit: string
  letterAria: string
  noteLabel: string
  noteBody: string
  copyLetterAria: string
  copyLetter: string
  downloadAria: string
  downloadCta: string
  regenerateAria: string
  regenerateCta: string
  resetAria: string
  resetCta: string
  priceAnchor: string
  humanizerCtaAria: string
  humanizerCta: string
  overHumanizerLimit: (current: string) => string
  txtForewarning: string
  restoreOriginal: string
  continuationIntro: string
  newLetterCta: string
  readyAnnouncement: string

  // Fetch failure messages
  rateLimited: (minutes: number | null) => string
  requestBlocked: string
  parseFailedFallback: string
  networkErrorParse: string
  generationFailedFallback: string
  generationFailedOk: string
  invalidInputCoverLetter: string
  emptyLetter: string
  networkErrorLetter: string

  // NormGapPanel
  normGapSummary: (n: number) => string

  // HumanizerModal: non-legal chrome only. The Widerruf checkbox text stays German
  // deliberately (§356(5) BGB legal declaration) regardless of UI language.
  humanizerEyebrow: string
  humanizerTitle: string
  humanizerCloseAria: string
  humanizerDirectionIntro: string
  humanizerRecommendedBadge: string
  humanizerRestoreReassurance: string
  humanizerDirectionTitle: Record<'formeller' | 'moderner' | 'praegnanter', string>
  humanizerDirectionBlurb: Record<'formeller' | 'moderner' | 'praegnanter', string>
  humanizerProcessing: string
  humanizerPaymentRefLabel: (reference: string) => string
  humanizerFailedMultipleTimes: string
  humanizerRetryPaid: string
  humanizerFooterLegal: string
  humanizerTermsLink: string
  humanizerPrivacyLink: string
  humanizerImprintLink: string
  humanizerDeliveredInSeconds: string
  humanizerPayCta: string
  humanizerPaying: string
  humanizerIntentInitError: string
  humanizerPendingAttemptNotice: string
  humanizerRefinementFailedGeneric: string
  humanizerNotRecognizedError: string
  humanizerEmptyResponseError: string
  humanizerPaymentNotCompleted: string
  humanizerPaymentFailedGeneric: string

  // PaketModal (Bewerbungspaket) chrome. Same legal-text rule as the Humanizer:
  // the Widerruf declaration and the "Zahlungspflichtig bestellen" button
  // wording are German legal strings in both UI languages.
  paketEyebrow: string
  paketTitle: string
  paketIntro: string
  paketContentPdf: string
  paketContentHumanizer: string
  paketPerApplicationNote: string
  paketContinueCta: string
  paketPayCta: string
  paketLockedExportCta: string
  paketUnlockedBadge: string
  paketIncludedRefinementNotice: string
  paketRefinementSpentNotice: string

  // PassModal (Bewerbungsphase-Pass) chrome. Same legal-text-stays-German rule
  // as Humanizer/Paket, but this is a DISTINCT declaration: the Pass is a
  // 30-day fixed-term SERVICE, not digital content, so its Widerruf consent
  // uses the proportional-value-substitute formula (§356(4)/§357a BGB), never
  // Paket's §356(5) digital-content declaration. Wording pending
  // native-speaker + legal review (PRD section 9, Q3).
  passEyebrow: string
  passModalTitle: string
  passModalPriceUnit: string
  passFeatureUnlimitedPaket: string
  passFeaturePdfExport: string
  passFeatureStorage: string
  passFeatureEndsAutomatically: (date: string) => string
  passContinueCta: string
  passPayCta: string
  passWiderrufText: string
  passVerifyError: string
  passFooterLegal: string
  // PassStatusChip: read-only lifecycle indicator (top bar + /konto)
  passAccessHeading: string
  passActiveBadge: string
  passChipActive: (date: string) => string
  passActiveUntilDays: (date: string, days: number) => string
  passStorageLabel: string
  passEndsAutomaticallyFooter: string
  passExpiredBadge: (date: string) => string
  passExpiredBody: (count: number) => string
  passExpiredFooter: string
  passRepurchaseCta: (priceFormatted: string) => string

  // LebenslaufEditor chrome
  addOptionalFields: string
  photoDetailsSummary: string
  addExperience: string
  addEducation: string
  addBullet: string
  addLanguage: string
  addSkill: string
  addSkillCategory: string
  removeEntryUp: string
  removeEntryDown: string
  removeEntryAria: string
  sectionUpAria: string
  sectionDownAria: string
  categoryRemoveConfirm: string
  categoryRemoveYes: string
  categoryRemoveCancel: string
  categoryRemoveAria: string
  categoryRemoveConfirmAria: string
  languageLevelAria: string
  languageLevelPlaceholder: string

  // Placeholders (field-level "+ ..." prompts) – chrome, so localized
  placeholderFullName: string
  placeholderAddress: string
  placeholderPhone: string
  placeholderEmail: string
  placeholderNationality: string
  placeholderDateOfBirth: string
  placeholderRole: string
  placeholderCompany: string
  placeholderLocation: string
  placeholderDate: string
  placeholderQualification: string
  placeholderInstitution: string
  placeholderCategoryName: string
  placeholderProfil: string
  placeholderSkill: string
  placeholderLanguageName: string

  // Photo upload (change 4)
  photoAria: string
  photoAddLabel: string
  photoOptionalSub: string
  photoRemoveAria: string
  photoStaysLocal: string
  photoTooLarge: string
  photoBadType: string
  // Photo crop (pan/zoom)
  photoFrameAria: string
  photoZoomAria: string
  photoDragHint: string
  photoReset: string

  // Extract-cv error messages (reason -> localized string)
  extractErrors: {
    too_large: string
    unsupported_type: string
    empty_extraction: string
  }
  extractGenericError: string

  // Stage 3 accounts – AccountMenu, save action, load list, /konto
  accountSignIn: string
  accountLink: string
  accountSignOut: string
  saveApplicationCta: string
  saveApplicationSaving: string
  saveApplicationSaved: string
  saveApplicationSignedOutHint: string
  saveApplicationLimitHint: string
  saveApplicationErrorHint: string
  // Save moment (design surface 05) - save card + saved-confirmation panel copy,
  // lifted verbatim from 05-save-moment.dc.html's 1c copy deck.
  saveLabel: string
  saveSuggestionHint: string
  saveContents: string
  saveConfirmed: string
  saveConfirmedLink: string
  saveCancelCta: string
  saveTitleAriaLabel: string
  saveRenameAria: string
  // Library gallery (design surface 01) - card gallery on /konto and the compact
  // in-tool gallery on /app. Copy lifted verbatim from 01-library.dc.html's 1f
  // copy deck; document-type badges (LL/AS/STELLENANZEIGE) stay German-only,
  // same convention as the DIN section labels, so they are not i18n keys.
  libraryTitle: string
  libraryEmptyStatus: string
  libraryEmptyBody: string
  libraryEmptyCta: string
  libraryNewCta: string
  libraryMenuOpen: string
  libraryMenuDuplicate: string
  libraryMenuRename: string
  libraryMenuDelete: string
  libraryMenuAriaLabel: (title: string) => string
  libraryRenameHelper: string
  libraryFilterPlaceholder: string
  libraryReadonlyBadge: string
  libraryReadonlyBanner: string
  libraryEditableBadge: string
  libraryStorageFree: string
  libraryFooterContents: string
  // CV-reuse save-flow radio (design surface 07, 1b/1c) - attach-to-existing
  // vs save-as-new inside the save card. Copy lifted verbatim from
  // 07-lebenslaeufe.dc.html's 1b mockup + 1c copy deck.
  cvsAssignLabel: string
  cvsAttachOption: string
  cvsNewOption: string
  cvsNewOptionHint: string
  cvsSnapshotNote: string
  cvsAttachMeta: (date: string, count: number) => string
  // Storage-gate chooser (design surface 02) - inline dismissible panel replacing
  // the plain state==='limit' text hint in the save rail. Copy lifted verbatim
  // from 02-storage-gate.dc.html's 1e copy deck; gatePassName/gatePlusName are
  // product names, kept identical in both languages (same convention as
  // paketEyebrow/humanizerEyebrow).
  gateEyebrow: string
  gateStorageStatus: string
  gateTitle: string
  gateSubtitle: string
  gatePassName: string
  gateRecommendedBadge: string
  gatePassPriceUnit: string
  gatePassFeature1: string
  gatePassFeature2: string
  gatePassCta: string
  gatePassHonest: string
  gatePlusName: string
  gatePlannedBadge: string
  gatePlusPrice: string
  gatePlusPriceUnit: string
  gatePlusFeature1: string
  gatePlusFeature2: string
  gatePlusCta: string
  gatePlusHonest: string
  gateAlternative: string
  gateLaterCta: string
  gateDismissAria: string
  gateAnchorTitle: string
  gateAnchorLineItem: (date: string) => string
  gateAnchorSumLabel: (count: number) => string
  gateAnchorPassLabel: string
  gateAnchor: (count: number, sumFormatted: string, passFormatted: string) => string
  gateAnchorPassCta: (priceFormatted: string) => string
  gateAnchorEndsAutomatically: string
  kontoLink: string
  savedApplicationsHeading: string
  savedApplicationsUpdated: (date: string) => string
  savedApplicationsReadOnlyBadge: string
  savedApplicationsOpen: string
  savedApplicationsEmpty: string
  kontoDisabledNotice: string
  kontoSignInIntro: string
  kontoSavedHeading: string
  kontoSavedHint: string
  kontoDeleteConfirm: string
  kontoDeleteCta: string
  kontoSubscriptionHeading: string
  kontoSubscriptionActive: (date: string) => string
  kontoSubscriptionNone: string
  kontoSubscribeCta: string
  kontoSubscribeError: string
  kontoCancelLink: string
  kontoDangerHeading: string
  kontoDeleteAccountCta: string
  kontoDeleteAccountConfirm: string
  kontoDeleteAccountWorking: string
  kontoDeleteAccountError: string
  kontoLoading: string
}

const en = {
  switchLangLabel: 'Switch interface language',

  inputHeadline: 'Convert your CV to a German Lebenslauf',
  inputIntro:
    'Paste your US or UK resume below – or upload it as PDF. We will reformat it to a norm-correct German tabellarischer Lebenslauf, grounded strictly in your real CV facts.',
  zeroRetention: 'Your CV is never stored or used for training – processing is stateless and zero-retention.',
  uploadButton: 'Upload PDF or .txt',
  uploadButtonBusy: 'Reading file …',
  uploadHintDefault: 'Read locally in your browser – the file never leaves your device.',
  uploadHintImported: (filename) => `Imported from ${filename} – review & edit below`,
  uploadGenericError: 'The file could not be read. Please copy the text into the field manually.',
  resumePlaceholder: 'Paste your resume here – name, contact info, work history, education, skills…',
  resumeAriaLabel: 'Resume text',
  tooLongSuffix: 'too long',
  submitCta: 'Convert to Lebenslauf',

  loadingMessages: ['Reading your CV…', 'Mapping to German norms…', 'Structuring the Lebenslauf…', 'Almost there…'],
  loadingAriaLabel: 'Parsing your CV, please wait',

  stepLebenslauf: 'Lebenslauf',
  stepQuestions: 'Questions',
  stepAnschreiben: 'Anschreiben',
  stepAriaLabel: (current, label) => `Step ${current} of 3: ${label}`,

  resultHeadline: 'Your Lebenslauf',
  normGapsFixed: (n) =>
    `${n === 1 ? '1 norm gap fixed' : `${n} norm gaps fixed`} for the German first scan – see what changed below.`,
  resultGroundedOnly: 'Grounded strictly in your real CV facts.',
  writeAnschreibenTitle: 'Write Anschreiben',
  writeAnschreibenBody:
    'Generate an authentic German cover letter grounded in your Lebenslauf. You will answer 3–5 short questions so the letter sounds like you, not generic AI prose.',
  writeAnschreibenPrice: 'Free to generate. An optional Humanizer+ polish (one-time 2,99 €, no subscription) is available on the finished letter.',
  writeAnschreibenCta: 'Write Anschreiben →',
  copyLebenslaufAria: 'Copy Lebenslauf to clipboard',
  copyLebenslauf: 'Copy Lebenslauf',
  copied: 'Copied ✓',
  copyFailed: 'Copy failed – please select the text manually.',
  copyFailedAria: 'Copy failed.',
  startOverLink: 'Start over / paste a new CV',
  startOverConfirm: 'This discards your converted Lebenslauf. Start over?',

  exportPdfAria: 'Export as PDF',
  exportPdfCta: 'Export as PDF',
  exportPdfHint: "Choose 'Save as PDF' in the print dialog.",
  ortDatumLabel: 'Ort/Datum line for the signature',

  errorTitle: 'Something went wrong',
  errorGeneric: 'An unexpected error occurred.',
  tryAgain: 'Try again',
  junkTitle: 'That did not look like a CV',
  junkBody:
    'We could not find a recognisable name and work or education history. Try pasting more of your resume – include your name, contact info, and at least one job or degree.',
  junkTip: 'Tip: free generations are limited per hour – make each attempt count.',
  junkPlaceholder: 'Paste your resume here…',

  clHeadline: 'Anschreiben',
  clIntro:
    'Paste the job posting and answer the questions below. The letter is grounded strictly in your Lebenslauf facts and your own words.',
  jobPostingLabel: 'Job posting',
  jobPostingPlaceholder: 'Paste the full job posting here…',
  jobPostingAria: 'Job posting',
  questionsIntro: 'A few quick questions – so the letter sounds like you, not generic AI prose:',
  answerAria: (n) => `Answer to question ${n}`,
  answerTooLong: 'answer too long',
  nativeSpeakerNote:
    'Native-quality German is the goal – but before sending to a real recruiter, have a native German speaker review the final letter.',
  submitLetterCta: 'Write my Anschreiben',
  backToLebenslauf: 'Back to Lebenslauf',

  streamingSectionLabel: 'Anschreiben',
  streamingInProgress: 'Generating Anschreiben…',
  streamingComposing: 'Composing… (the first sentences take a few seconds)',
  streamingAriaGenerating: 'Generating your Anschreiben…',

  clResultHeadline: 'Your German application is ready.',
  clResultSubline: 'Lebenslauf converted, Anschreiben written – grounded in your facts.',
  clickToEdit: 'Click to edit',
  letterAria: 'Anschreiben',
  noteLabel: 'Note',
  noteBody: 'Before you send it: have a native German speaker review the final letter.',
  copyLetterAria: 'Copy Anschreiben to clipboard',
  copyLetter: 'Copy Anschreiben',
  downloadAria: 'Download Anschreiben as .txt',
  downloadCta: 'Download .txt',
  regenerateAria: 'Regenerate Anschreiben',
  regenerateCta: 'Regenerate',
  resetAria: 'Reset and paste a new Lebenslauf',
  resetCta: 'Start over',
  priceAnchor: 'One-time 2,99 € – a fraction of what professional rewrite services charge. No subscription.',
  humanizerCtaAria: 'Buy Feinschliff mit Humanizer+',
  humanizerCta: 'Feinschliff mit Humanizer+ – 2,99 €',
  overHumanizerLimit: (current) => `Humanizer+ is available for letters up to 10,000 characters – yours is currently ${current}.`,
  txtForewarning: '.txt download is free. Print-ready PDF export (DIN 5008) is part of the Bewerbungspaket, 4,99 € one-time.',
  restoreOriginal: 'Restore original',
  continuationIntro: 'Applying to more roles? Write another Anschreiben from the same Lebenslauf.',
  newLetterCta: 'New Anschreiben',
  readyAnnouncement: 'Anschreiben ready.',

  rateLimited: (minutes) =>
    minutes
      ? `Too many requests – the free tier is rate-limited. Please try again in about ${minutes} minutes.`
      : 'Too many requests – the free tier is rate-limited. Please try again in a few minutes.',
  requestBlocked: 'Request blocked. Please use the app directly at this site and try again.',
  parseFailedFallback: 'Failed to parse CV. Please try again.',
  networkErrorParse: 'Network error – please check your connection and try again.',
  generationFailedFallback: 'Generation failed – please try again.',
  generationFailedOk: 'Generation failed – please try again.',
  invalidInputCoverLetter:
    "Your input wasn't recognized as a CV and job posting. Please check that both fields contain the real documents – then try again.",
  emptyLetter: 'No letter was generated – please try again.',
  networkErrorLetter: 'Network error – please try again.',

  normGapSummary: (n) => `What changed and why (${n} ${n === 1 ? 'note' : 'notes'})`,

  humanizerEyebrow: 'Humanizer+',
  humanizerTitle: 'Feinschliff, 2,99 €',
  humanizerCloseAria: 'Close',
  humanizerDirectionIntro:
    "Your Anschreiben is ready. The Feinschliff tunes tone and register to the company's culture, your facts and voice stay unchanged.",
  humanizerRecommendedBadge: 'Recommended for this posting',
  humanizerRestoreReassurance: 'Your original letter stays, you can restore it anytime after the refinement.',
  humanizerDirectionTitle: { formeller: 'Formeller', moderner: 'Moderner', praegnanter: 'Prägnanter' },
  humanizerDirectionBlurb: {
    formeller: 'Corporate & Mittelstand: classic, conservative, correct.',
    moderner: 'Startup & scale-up: direct, energetic, no ceremony.',
    praegnanter: 'Tighten & condense: every line earns its place.',
  },
  humanizerProcessing: 'Processing …',
  humanizerPaymentRefLabel: (reference) => `Payment reference: ${reference}`,
  humanizerFailedMultipleTimes:
    "Failed multiple times? We'll refund the purchase, email this reference to the address listed in the",
  humanizerRetryPaid: 'Try again (already paid)',
  humanizerFooterLegal: 'One-time payment, no subscription.',
  humanizerTermsLink: 'Terms & withdrawal policy',
  humanizerPrivacyLink: 'Privacy',
  humanizerImprintLink: 'Imprint',
  humanizerDeliveredInSeconds: 'Delivered in seconds. If the refinement fails, you can retry free, or get a refund.',
  humanizerPayCta: 'Confirm and pay (2,99 €)',
  humanizerPaying: 'Processing …',
  humanizerIntentInitError: 'Payment could not be initialized. Please try again later.',
  humanizerPendingAttemptNotice: 'A paid refinement is still open. You can retry without paying again.',
  humanizerRefinementFailedGeneric: 'Refinement failed. Your payment stays valid, please try again.',
  humanizerNotRecognizedError:
    'The text was not recognized as an Anschreiben. Your payment stays valid, please try again.',
  humanizerEmptyResponseError: 'Empty response. Your payment stays valid, please try again.',
  humanizerPaymentNotCompleted: 'Payment not completed. Please try again.',
  humanizerPaymentFailedGeneric: 'Payment failed. You were not charged, please try again.',

  paketEyebrow: 'Bewerbungspaket',
  paketTitle: 'Print-ready export, 4,99 €',
  paketIntro:
    'One-time purchase for this application. Your documents, typeset for print and ready to send:',
  paketContentPdf: 'Print-ready PDF export of Lebenslauf and Anschreiben (DIN 5008, A4)',
  paketContentHumanizer: 'One Humanizer+ refinement included (worth 2,99 €)',
  paketPerApplicationNote: 'Applies to this application. A new application is a new Paket.',
  paketContinueCta: 'Continue to payment',
  paketPayCta: 'Zahlungspflichtig bestellen (4,99 €)',
  paketLockedExportCta: 'Unlock PDF export (4,99 €)',
  paketUnlockedBadge: 'Bewerbungspaket active',
  paketIncludedRefinementNotice:
    'Included in your Bewerbungspaket, no additional payment needed.',
  paketRefinementSpentNotice:
    'The refinement included in your Bewerbungspaket has already been used. A further refinement costs 2,99 €.',

  passEyebrow: 'Bewerbungsphase-Pass',
  passModalTitle: 'Every application. 30 days.',
  passModalPriceUnit: 'One-time · No subscription',
  passFeatureUnlimitedPaket: 'Unlimited application packages',
  passFeaturePdfExport: 'PDF export and refinement',
  passFeatureStorage: 'Storage for 25 applications',
  passFeatureEndsAutomatically: (date) => `Ends automatically on ${date}`,
  passContinueCta: 'Continue to payment',
  passPayCta: 'Zahlungspflichtig bestellen (14,99 €)',
  passWiderrufText:
    'Ich verlange, dass der Pass sofort beginnt. Widerrufe ich innerhalb von 14 Tagen, zahle ich anteiligen Wertersatz für die bereits genutzte Laufzeit.',
  passVerifyError: 'Payment succeeded, but the Pass could not be activated yet. Please try again.',
  passFooterLegal: 'Total price incl. VAT. Ends automatically, no renewal.',
  passAccessHeading: 'Your access',
  passActiveBadge: 'Active',
  passChipActive: (date) => `Pass active until ${date}`,
  passActiveUntilDays: (date, days) => `Active until ${date} · ${days === 1 ? '1 day' : `${days} days`} left`,
  passStorageLabel: 'Storage',
  passEndsAutomaticallyFooter: 'Ends automatically. No cancellation needed.',
  passExpiredBadge: (date) => `Expired on ${date}`,
  passExpiredBody: (count) =>
    `Your ${count === 1 ? '1 application stays' : `${count} applications stay`} stored and readable. The newest stays editable; older ones are read-only: viewing, loading, duplicating and deleting always work.`,
  passExpiredFooter: 'Nothing was charged. The Pass never renews.',
  passRepurchaseCta: (priceFormatted) => `Buy Pass again · ${priceFormatted}`,

  addOptionalFields: '+ Add optional fields (Nationalität, Geburtsdatum)',
  photoDetailsSummary: 'Photo (optional) – details',
  addExperience: '+ Add work experience',
  addEducation: '+ Add education',
  addBullet: '+ Add task',
  addLanguage: '+ Add language',
  addSkill: '+ Add skill',
  addSkillCategory: '+ Add category',
  removeEntryUp: 'Move entry up',
  removeEntryDown: 'Move entry down',
  removeEntryAria: 'Remove entry',
  sectionUpAria: 'Move section up',
  sectionDownAria: 'Move section down',
  categoryRemoveConfirm: 'Remove category and all skills?',
  categoryRemoveYes: 'Yes',
  categoryRemoveCancel: 'Cancel',
  categoryRemoveAria: 'Remove category',
  categoryRemoveConfirmAria: 'Confirm remove category',
  languageLevelAria: 'Language level',
  languageLevelPlaceholder: '(choose level)',

  placeholderFullName: '+ First name, last name',
  placeholderAddress: '+ Address',
  placeholderPhone: '+ Phone number',
  placeholderEmail: '+ Email address',
  placeholderNationality: '+ Nationality',
  placeholderDateOfBirth: '+ Date of birth',
  placeholderRole: '+ Job title',
  placeholderCompany: '+ Company',
  placeholderLocation: '+ Location',
  placeholderDate: '+ Date',
  placeholderQualification: '+ Qualification',
  placeholderInstitution: '+ Institution',
  placeholderCategoryName: '+ Category name',
  placeholderProfil: '+ Add a short profile (2-4 lines: who you are, your strongest expertise)',
  placeholderSkill: '+ Skill',
  placeholderLanguageName: '+ Add language',

  photoAria: 'Application photo',
  photoAddLabel: '+ Photo',
  photoOptionalSub: 'optional',
  photoRemoveAria: 'Remove photo',
  photoStaysLocal: 'Stays in your browser. Never uploaded.',
  photoTooLarge: 'The photo is too large (max. 8 MB).',
  photoBadType: 'Please choose a JPEG, PNG, or WebP image.',
  photoFrameAria: 'Application photo. Drag or use the arrow keys to reposition it inside the frame.',
  photoZoomAria: 'Zoom photo',
  photoDragHint: 'Drag to reposition, slider to zoom.',
  photoReset: 'Reset crop',

  extractErrors: {
    too_large: 'The file is too large (max. 10 MB).',
    unsupported_type: 'Please choose a PDF or .txt file.',
    empty_extraction:
      "No text could be read from this file – it's probably a scanned PDF. Please copy the text into the field manually instead.",
  },
  extractGenericError: 'The file could not be read. Please copy the text into the field manually.',

  accountSignIn: 'Sign in',
  accountLink: 'Account',
  accountSignOut: 'Sign out',
  saveApplicationCta: 'Save',
  saveApplicationSaving: 'Saving …',
  saveApplicationSaved: 'Saved to your account ✓',
  saveApplicationSignedOutHint: 'Sign in first – open your account in a new tab, then try again.',
  saveApplicationLimitHint: 'Free accounts store one application. Manage or subscribe in your account.',
  saveApplicationErrorHint: 'Could not save. Please try again.',
  saveLabel: 'Save as',
  saveSuggestionHint: 'Suggested from the job posting',
  saveContents: 'Saved: Lebenslauf, Anschreiben, job posting, your answers. No photos.',
  saveConfirmed: 'Saved',
  saveConfirmedLink: 'Open in My applications',
  saveCancelCta: 'Cancel',
  saveTitleAriaLabel: 'Application title',
  saveRenameAria: 'Edit title',
  libraryTitle: 'My applications',
  libraryEmptyStatus: 'No saved applications yet',
  libraryEmptyBody:
    'Save a finished application and you can reopen it here, rename it, and duplicate it as the starting point for your next role.',
  libraryEmptyCta: 'Create application',
  libraryNewCta: 'New application',
  libraryMenuOpen: 'Open',
  libraryMenuDuplicate: 'New application from this one',
  libraryMenuRename: 'Rename',
  libraryMenuDelete: 'Delete',
  libraryMenuAriaLabel: (title) => `More actions for ${title}`,
  libraryRenameHelper: 'Enter to save · Esc to cancel',
  libraryFilterPlaceholder: 'Filter by title or company',
  libraryReadonlyBadge: 'Read-only',
  libraryReadonlyBanner:
    'Your newest application stays editable. Older ones are read-only: viewing, loading, duplicating, exporting and deleting always work.',
  libraryEditableBadge: 'Editable',
  libraryStorageFree: '1 of 1 saved · Free',
  libraryFooterContents:
    'Your CV text, the Lebenslauf, the Anschreiben, the job posting and your answers. No photos.',
  cvsAssignLabel: 'Assign Lebenslauf',
  cvsAttachOption: 'Attach to an existing Lebenslauf',
  cvsNewOption: 'Save as a new Lebenslauf',
  cvsNewOptionHint: 'For example for a second language or specialization.',
  cvsSnapshotNote:
    'Applications stay snapshots: later changes to the Lebenslauf do not apply retroactively.',
  cvsAttachMeta: (date, count) =>
    count === 1 ? `As of ${date} · used in 1 application` : `As of ${date} · used in ${count} applications`,
  gateEyebrow: 'Storage',
  gateStorageStatus: '1 of 1 application saved.',
  gateTitle: 'Your free storage slot is taken.',
  gateSubtitle:
    'Your document stays complete and free; the only limit is how much we store for you.',
  gatePassName: 'Bewerbungsphase-Pass',
  gateRecommendedBadge: 'Recommended',
  gatePassPriceUnit: 'one-time · 30 days',
  gatePassFeature1: 'Unlimited application packages: PDF and refinement included',
  gatePassFeature2: 'Storage for 25 applications',
  gatePassCta: 'Buy Pass',
  gatePassHonest: 'Expires on its own. Nothing to cancel.',
  gatePlusName: 'ScanReady Plus',
  gatePlannedBadge: 'Planned',
  gatePlusPrice: '5,99 €',
  gatePlusPriceUnit: 'per month',
  gatePlusFeature1: 'Everything from the Pass, ongoing',
  gatePlusFeature2: 'Unlimited storage',
  gatePlusCta: 'Notify me',
  gatePlusHonest: 'Cancel monthly, cancellation button included, a reminder before every renewal.',
  gateAlternative: 'Or: delete the saved application and reuse the slot. Free, any time.',
  gateLaterCta: 'Later',
  gateDismissAria: 'Dismiss',
  gateAnchorTitle: 'You are buying one at a time. Your whole application phase adds up differently.',
  gateAnchorLineItem: (date) => `Bewerbungspaket · ${date}`,
  gateAnchorSumLabel: (count) => (count === 2 ? 'Two packages bought' : `${count} packages bought`),
  gateAnchorPassLabel: 'The Pass · all applications, 30 days',
  gateAnchor: (count, sumFormatted, passFormatted) =>
    `${count === 2 ? 'Two packages bought' : `${count} packages bought`} = ${sumFormatted}. The Pass is ${passFormatted} and covers your whole application phase.`,
  gateAnchorPassCta: (priceFormatted) => `Buy Pass · ${priceFormatted}`,
  gateAnchorEndsAutomatically: 'Ends automatically',
  kontoLink: 'Account',
  savedApplicationsHeading: 'Saved applications',
  savedApplicationsUpdated: (date) => `Updated ${date}`,
  savedApplicationsReadOnlyBadge: 'Read-only',
  savedApplicationsOpen: 'Open',
  savedApplicationsEmpty: 'No saved applications yet.',
  kontoDisabledNotice: 'Accounts are not available yet.',
  kontoSignInIntro: 'Sign in to save applications and manage your subscription.',
  kontoSavedHeading: 'Saved applications',
  kontoSavedHint: 'Opening a saved application happens in the tool at /app.',
  kontoDeleteConfirm: 'Delete this saved application?',
  kontoDeleteCta: 'Delete',
  kontoSubscriptionHeading: 'Subscription',
  kontoSubscriptionActive: (date) => `Active – renews/ends ${date}`,
  kontoSubscriptionNone: 'No active subscription.',
  kontoSubscribeCta: 'Subscribe',
  kontoSubscribeError: 'Das Abonnement ist derzeit nicht verfügbar.',
  kontoCancelLink: 'Cancel subscription',
  kontoDangerHeading: 'Danger zone',
  kontoDeleteAccountCta: 'Delete account',
  kontoDeleteAccountConfirm:
    'This permanently deletes your account and all saved applications (GDPR Art. 17). This cannot be undone. Continue?',
  kontoDeleteAccountWorking: 'Deleting …',
  kontoDeleteAccountError: 'Could not delete account. Please try again.',
  kontoLoading: 'Loading …',
} satisfies Dict

const de = {
  switchLangLabel: 'Oberflächensprache wechseln',

  inputHeadline: 'Wandeln Sie Ihren Lebenslauf ins deutsche Format um',
  inputIntro:
    'Fügen Sie Ihren US- oder UK-Lebenslauf unten ein – oder laden Sie ihn als PDF hoch. Wir formatieren ihn zu einem normgerechten deutschen tabellarischen Lebenslauf, streng auf Basis Ihrer echten Angaben.',
  zeroRetention: 'Ihr Lebenslauf wird nie gespeichert und nie für KI-Training verwendet – nach der Verarbeitung bleibt nichts zurück.',
  uploadButton: 'PDF oder .txt hochladen',
  uploadButtonBusy: 'Datei wird gelesen …',
  uploadHintDefault: 'Wird lokal in Ihrem Browser gelesen – die Datei verlässt Ihr Gerät nie.',
  uploadHintImported: (filename) => `Importiert aus ${filename} – unten prüfen & bearbeiten`,
  uploadGenericError: 'Die Datei konnte nicht gelesen werden. Bitte fügen Sie den Text manuell in das Feld ein.',
  resumePlaceholder: 'Fügen Sie hier Ihren Lebenslauf ein – Name, Kontaktdaten, Berufserfahrung, Ausbildung, Kenntnisse…',
  resumeAriaLabel: 'Lebenslauf-Text',
  tooLongSuffix: 'zu lang',
  submitCta: 'In Lebenslauf umwandeln',

  loadingMessages: ['Lebenslauf wird gelesen…', 'Abgleich mit deutschen Normen…', 'Lebenslauf wird strukturiert…', 'Gleich fertig…'],
  loadingAriaLabel: 'Ihr Lebenslauf wird verarbeitet, bitte warten',

  stepLebenslauf: 'Lebenslauf',
  stepQuestions: 'Fragen',
  stepAnschreiben: 'Anschreiben',
  stepAriaLabel: (current, label) => `Schritt ${current} von 3: ${label}`,

  resultHeadline: 'Ihr Lebenslauf',
  normGapsFixed: (n) =>
    `${n === 1 ? '1 Normlücke geschlossen' : `${n} Normlücken geschlossen`} für den ersten Blick deutscher Recruiter – Details unten.`,
  resultGroundedOnly: 'Streng auf Basis Ihrer echten Lebenslauf-Angaben.',
  writeAnschreibenTitle: 'Anschreiben verfassen',
  writeAnschreibenBody:
    'Erstellen Sie ein authentisches deutsches Anschreiben auf Basis Ihres Lebenslaufs. Sie beantworten 3–5 kurze Fragen, damit der Brief nach Ihnen klingt – nicht nach generischem KI-Text.',
  writeAnschreibenPrice: 'Kostenlos erstellbar. Ein optionaler Feinschliff mit Humanizer+ (einmalig 2,99 €, kein Abo) ist für den fertigen Brief verfügbar.',
  writeAnschreibenCta: 'Anschreiben verfassen →',
  copyLebenslaufAria: 'Lebenslauf in die Zwischenablage kopieren',
  copyLebenslauf: 'Lebenslauf kopieren',
  copied: 'Kopiert ✓',
  copyFailed: 'Kopieren fehlgeschlagen – bitte Text manuell markieren.',
  copyFailedAria: 'Kopieren fehlgeschlagen.',
  startOverLink: 'Neu beginnen / neuen Lebenslauf einfügen',
  startOverConfirm: 'Damit wird Ihr umgewandelter Lebenslauf verworfen. Neu beginnen?',

  exportPdfAria: 'Als PDF exportieren',
  exportPdfCta: 'Als PDF exportieren',
  exportPdfHint: "Wählen Sie im Druckdialog 'Als PDF sichern'.",
  ortDatumLabel: 'Ort/Datum-Zeile für die Unterschrift',

  errorTitle: 'Etwas ist schiefgelaufen',
  errorGeneric: 'Ein unerwarteter Fehler ist aufgetreten.',
  tryAgain: 'Erneut versuchen',
  junkTitle: 'Das sah nicht nach einem Lebenslauf aus',
  junkBody:
    'Wir konnten keinen erkennbaren Namen und keine Berufs- oder Ausbildungsgeschichte finden. Fügen Sie mehr von Ihrem Lebenslauf ein – inklusive Name, Kontaktdaten und mindestens einer Stelle oder eines Abschlusses.',
  junkTip: 'Tipp: kostenlose Erstellungen sind pro Stunde begrenzt – nutzen Sie jeden Versuch gut.',
  junkPlaceholder: 'Fügen Sie hier Ihren Lebenslauf ein…',

  clHeadline: 'Anschreiben',
  clIntro:
    'Fügen Sie die Stellenanzeige ein und beantworten Sie die Fragen unten. Der Brief basiert streng auf Ihren Lebenslauf-Angaben und Ihren eigenen Worten.',
  jobPostingLabel: 'Stellenanzeige',
  jobPostingPlaceholder: 'Fügen Sie hier die vollständige Stellenanzeige ein…',
  jobPostingAria: 'Stellenanzeige',
  questionsIntro: 'Ein paar kurze Fragen – damit der Brief nach Ihnen klingt, nicht nach generischem KI-Text:',
  answerAria: (n) => `Antwort auf Frage ${n}`,
  answerTooLong: 'Antwort zu lang',
  nativeSpeakerNote:
    'Muttersprachliches Deutsch ist das Ziel – lassen Sie den fertigen Brief aber vor dem Versand von einer deutschen Muttersprachlerin oder einem Muttersprachler prüfen.',
  submitLetterCta: 'Mein Anschreiben verfassen',
  backToLebenslauf: 'Zurück zum Lebenslauf',

  streamingSectionLabel: 'Anschreiben',
  streamingInProgress: 'Anschreiben wird erstellt…',
  streamingComposing: 'Wird verfasst… (die ersten Sätze dauern ein paar Sekunden)',
  streamingAriaGenerating: 'Ihr Anschreiben wird erstellt…',

  clResultHeadline: 'Ihre deutsche Bewerbung ist fertig.',
  clResultSubline: 'Lebenslauf umgewandelt, Anschreiben verfasst – auf Basis Ihrer Angaben.',
  clickToEdit: 'Zum Bearbeiten klicken',
  letterAria: 'Anschreiben',
  noteLabel: 'Hinweis',
  noteBody: 'Vor dem Versand: lassen Sie den fertigen Brief von einer deutschen Muttersprachlerin oder einem Muttersprachler prüfen.',
  copyLetterAria: 'Anschreiben in die Zwischenablage kopieren',
  copyLetter: 'Anschreiben kopieren',
  downloadAria: 'Anschreiben als .txt herunterladen',
  downloadCta: '.txt herunterladen',
  regenerateAria: 'Anschreiben neu erstellen',
  regenerateCta: 'Neu erstellen',
  resetAria: 'Zurücksetzen und neuen Lebenslauf einfügen',
  resetCta: 'Neu beginnen',
  priceAnchor: 'Einmalig 2,99 € – ein Bruchteil dessen, was professionelle Schreibdienste verlangen. Kein Abo.',
  humanizerCtaAria: 'Feinschliff mit Humanizer+ kaufen',
  humanizerCta: 'Feinschliff mit Humanizer+ – 2,99 €',
  overHumanizerLimit: (current) => `Humanizer+ ist für Briefe bis 10.000 Zeichen verfügbar – Ihrer hat derzeit ${current}.`,
  txtForewarning: 'Der .txt-Download ist kostenlos. Der druckfertige PDF-Export (DIN 5008) ist Teil des Bewerbungspakets, einmalig 4,99 €.',
  restoreOriginal: 'Original wiederherstellen',
  continuationIntro: 'Bewerben Sie sich auf weitere Stellen? Verfassen Sie ein weiteres Anschreiben zum selben Lebenslauf.',
  newLetterCta: 'Neues Anschreiben',
  readyAnnouncement: 'Anschreiben fertig.',

  rateLimited: (minutes) =>
    minutes
      ? `Zu viele Anfragen – die kostenlose Nutzung ist zeitlich begrenzt. Bitte versuchen Sie es in etwa ${minutes} Minuten erneut.`
      : 'Zu viele Anfragen – die kostenlose Nutzung ist zeitlich begrenzt. Bitte versuchen Sie es in ein paar Minuten erneut.',
  requestBlocked: 'Anfrage blockiert. Bitte nutzen Sie die App direkt auf dieser Seite und versuchen Sie es erneut.',
  parseFailedFallback: 'Lebenslauf konnte nicht verarbeitet werden. Bitte erneut versuchen.',
  networkErrorParse: 'Netzwerkfehler – bitte Verbindung prüfen und erneut versuchen.',
  generationFailedFallback: 'Erstellung fehlgeschlagen – bitte erneut versuchen.',
  generationFailedOk: 'Erstellung fehlgeschlagen – bitte erneut versuchen.',
  invalidInputCoverLetter:
    'Ihre Eingabe wurde nicht als Lebenslauf und Stellenanzeige erkannt. Bitte prüfen Sie, dass beide Felder die echten Dokumente enthalten – und versuchen Sie es erneut.',
  emptyLetter: 'Es wurde kein Brief erstellt – bitte erneut versuchen.',
  networkErrorLetter: 'Netzwerkfehler – bitte erneut versuchen.',

  normGapSummary: (n) => `Was hat sich geändert und warum? (${n} ${n === 1 ? 'Hinweis' : 'Hinweise'})`,

  humanizerEyebrow: 'Humanizer+',
  humanizerTitle: 'Feinschliff, 2,99 €',
  humanizerCloseAria: 'Schließen',
  humanizerDirectionIntro:
    'Ihr Anschreiben ist fertig. Der Feinschliff passt Ton und Register an die Unternehmenskultur an, Ihre Fakten und Ihre Stimme bleiben unverändert.',
  humanizerRecommendedBadge: 'Empfohlen für diese Stellenanzeige',
  humanizerRestoreReassurance: 'Ihr Originalbrief bleibt erhalten, Sie können ihn nach dem Feinschliff jederzeit wiederherstellen.',
  humanizerDirectionTitle: { formeller: 'Formeller', moderner: 'Moderner', praegnanter: 'Prägnanter' },
  humanizerDirectionBlurb: {
    formeller: 'Konzern & Mittelstand: klassisch, konservativ, korrekt.',
    moderner: 'Startup & Scale-up: direkt, energiegeladen, ohne Förmlichkeit.',
    praegnanter: 'Straffen & verdichten: jede Zeile hat ihren Platz verdient.',
  },
  humanizerProcessing: 'Wird verarbeitet …',
  humanizerPaymentRefLabel: (reference) => `Zahlungsreferenz: ${reference}`,
  humanizerFailedMultipleTimes:
    'Mehrfach fehlgeschlagen? Wir erstatten den Kaufpreis, senden Sie diese Referenz an die im',
  humanizerRetryPaid: 'Erneut versuchen (bereits bezahlt)',
  humanizerFooterLegal: 'Einmalige Zahlung, kein Abo.',
  humanizerTermsLink: 'AGB & Widerrufsrecht',
  humanizerPrivacyLink: 'Datenschutz',
  humanizerImprintLink: 'Impressum',
  humanizerDeliveredInSeconds: 'In Sekunden geliefert. Falls der Feinschliff fehlschlägt, können Sie kostenlos erneut versuchen oder eine Rückerstattung erhalten.',
  humanizerPayCta: 'Zahlungspflichtig bestellen (2,99 €)',
  humanizerPaying: 'Wird verarbeitet …',
  humanizerIntentInitError: 'Die Zahlung konnte nicht initialisiert werden. Bitte versuchen Sie es später erneut.',
  humanizerPendingAttemptNotice: 'Ein bezahlter Feinschliff ist noch offen. Sie können es erneut versuchen, ohne erneut zu bezahlen.',
  humanizerRefinementFailedGeneric: 'Feinschliff fehlgeschlagen. Ihre Zahlung bleibt gültig, bitte versuchen Sie es erneut.',
  humanizerNotRecognizedError:
    'Der Text wurde nicht als Anschreiben erkannt. Ihre Zahlung bleibt gültig, bitte versuchen Sie es erneut.',
  humanizerEmptyResponseError: 'Leere Antwort. Ihre Zahlung bleibt gültig, bitte versuchen Sie es erneut.',
  humanizerPaymentNotCompleted: 'Zahlung nicht abgeschlossen. Bitte erneut versuchen.',
  humanizerPaymentFailedGeneric: 'Zahlung fehlgeschlagen. Es wurde nichts abgebucht, bitte versuchen Sie es erneut.',

  paketEyebrow: 'Bewerbungspaket',
  paketTitle: 'Druckfertiger Export, 4,99 €',
  paketIntro:
    'Einmalkauf für diese Bewerbung. Ihre Dokumente, druckfertig gesetzt und bereit zum Versand:',
  paketContentPdf: 'Druckfertiger PDF-Export von Lebenslauf und Anschreiben (DIN 5008, A4)',
  paketContentHumanizer: 'Ein Humanizer+ Feinschliff inklusive (Wert: 2,99 €)',
  paketPerApplicationNote: 'Gilt für diese Bewerbung. Eine neue Bewerbung ist ein neues Paket.',
  paketContinueCta: 'Weiter zur Zahlung',
  paketPayCta: 'Zahlungspflichtig bestellen (4,99 €)',
  paketLockedExportCta: 'PDF-Export freischalten (4,99 €)',
  paketUnlockedBadge: 'Bewerbungspaket aktiv',
  paketIncludedRefinementNotice:
    'In Ihrem Bewerbungspaket enthalten, keine weitere Zahlung nötig.',
  paketRefinementSpentNotice:
    'Der im Bewerbungspaket enthaltene Feinschliff wurde bereits genutzt. Ein weiterer Feinschliff kostet 2,99 €.',

  passEyebrow: 'Bewerbungsphase-Pass',
  passModalTitle: 'Alle Bewerbungen. 30 Tage.',
  passModalPriceUnit: 'Einmalig · Kein Abo',
  passFeatureUnlimitedPaket: 'Unbegrenzte Bewerbungspakete',
  passFeaturePdfExport: 'PDF-Export und Feinschliff',
  passFeatureStorage: 'Speicher für 25 Bewerbungen',
  passFeatureEndsAutomatically: (date) => `Endet automatisch am ${date}`,
  passContinueCta: 'Weiter zur Zahlung',
  passPayCta: 'Zahlungspflichtig bestellen (14,99 €)',
  passWiderrufText:
    'Ich verlange, dass der Pass sofort beginnt. Widerrufe ich innerhalb von 14 Tagen, zahle ich anteiligen Wertersatz für die bereits genutzte Laufzeit.',
  passVerifyError: 'Die Zahlung war erfolgreich, aber der Pass konnte noch nicht aktiviert werden. Bitte versuchen Sie es erneut.',
  passFooterLegal: 'Gesamtpreis inkl. MwSt. Endet automatisch, keine Verlängerung.',
  passAccessHeading: 'Ihr Zugang',
  passActiveBadge: 'Aktiv',
  passChipActive: (date) => `Pass aktiv bis ${date}`,
  passActiveUntilDays: (date, days) => `Aktiv bis ${date} · noch ${days === 1 ? '1 Tag' : `${days} Tage`}`,
  passStorageLabel: 'Speicher',
  passEndsAutomaticallyFooter: 'Endet automatisch. Keine Kündigung nötig.',
  passExpiredBadge: (date) => `Abgelaufen am ${date}`,
  passExpiredBody: (count) =>
    `Ihre ${count === 1 ? '1 Bewerbung bleibt' : `${count} Bewerbungen bleiben`} gespeichert und lesbar. Die neueste bleibt bearbeitbar, ältere sind schreibgeschützt: ansehen, laden, duplizieren und löschen geht immer.`,
  passExpiredFooter: 'Es wurde nichts abgebucht. Der Pass verlängert sich nie.',
  passRepurchaseCta: (priceFormatted) => `Pass erneut kaufen · ${priceFormatted}`,

  addOptionalFields: '+ Optionale Felder hinzufügen (Nationalität, Geburtsdatum)',
  photoDetailsSummary: 'Foto (optional) – Details',
  addExperience: '+ Berufserfahrung hinzufügen',
  addEducation: '+ Bildungsabschluss hinzufügen',
  addBullet: '+ Aufgabe hinzufügen',
  addLanguage: '+ Sprache hinzufügen',
  addSkill: '+ Kenntnis hinzufügen',
  addSkillCategory: '+ Kategorie hinzufügen',
  removeEntryUp: 'Eintrag nach oben',
  removeEntryDown: 'Eintrag nach unten',
  removeEntryAria: 'Eintrag entfernen',
  sectionUpAria: 'Abschnitt nach oben',
  sectionDownAria: 'Abschnitt nach unten',
  categoryRemoveConfirm: 'Kategorie und alle Kenntnisse entfernen?',
  categoryRemoveYes: 'Ja',
  categoryRemoveCancel: 'Abbrechen',
  categoryRemoveAria: 'Kategorie entfernen',
  categoryRemoveConfirmAria: 'Kategorie entfernen bestätigen',
  languageLevelAria: 'Sprachniveau',
  languageLevelPlaceholder: '(Niveau wählen)',

  placeholderFullName: '+ Vorname, Nachname',
  placeholderAddress: '+ Adresse',
  placeholderPhone: '+ Telefonnummer',
  placeholderEmail: '+ E-Mail-Adresse',
  placeholderNationality: '+ Nationalität',
  placeholderDateOfBirth: '+ Geburtsdatum',
  placeholderRole: '+ Berufsbezeichnung',
  placeholderCompany: '+ Unternehmen',
  placeholderLocation: '+ Standort',
  placeholderDate: '+ Datum',
  placeholderQualification: '+ Abschluss',
  placeholderInstitution: '+ Bildungseinrichtung',
  placeholderCategoryName: '+ Kategoriename',
  placeholderProfil: '+ Kurzprofil hinzufügen (2-4 Zeilen: wer Sie sind, Ihre stärkste Expertise)',
  placeholderSkill: '+ Kenntnis',
  placeholderLanguageName: '+ Sprache hinzufügen',

  photoAria: 'Bewerbungsfoto',
  photoAddLabel: '+ Foto',
  photoOptionalSub: 'optional',
  photoRemoveAria: 'Foto entfernen',
  photoStaysLocal: 'Bleibt in Ihrem Browser. Wird nie hochgeladen.',
  photoTooLarge: 'Das Foto ist zu groß (max. 8 MB).',
  photoBadType: 'Bitte wählen Sie ein JPEG-, PNG- oder WebP-Bild.',
  photoFrameAria: 'Bewerbungsfoto. Zum Ausrichten ziehen oder Pfeiltasten verwenden.',
  photoZoomAria: 'Foto zoomen',
  photoDragHint: 'Zum Ausrichten ziehen, Regler zum Zoomen.',
  photoReset: 'Ausschnitt zurücksetzen',

  extractErrors: {
    too_large: 'Die Datei ist zu groß (max. 10 MB).',
    unsupported_type: 'Bitte wählen Sie eine PDF- oder .txt-Datei.',
    empty_extraction:
      'Aus dieser Datei konnte kein Text gelesen werden – vermutlich ein gescanntes PDF. Bitte fügen Sie den Text stattdessen manuell ein.',
  },
  extractGenericError: 'Die Datei konnte nicht gelesen werden. Bitte fügen Sie den Text manuell in das Feld ein.',

  accountSignIn: 'Anmelden',
  accountLink: 'Konto',
  accountSignOut: 'Abmelden',
  saveApplicationCta: 'Speichern',
  saveApplicationSaving: 'Wird gespeichert …',
  saveApplicationSaved: 'Im Konto gespeichert ✓',
  saveApplicationSignedOutHint: 'Bitte zuerst anmelden – Konto in einem neuen Tab öffnen, dann erneut versuchen.',
  saveApplicationLimitHint: 'Kostenlose Konten speichern eine Bewerbung. Verwalten oder abonnieren Sie im Konto.',
  saveApplicationErrorHint: 'Speichern fehlgeschlagen. Bitte erneut versuchen.',
  saveLabel: 'Speichern als',
  saveSuggestionHint: 'Vorschlag aus der Stellenanzeige',
  saveContents: 'Gespeichert werden: Lebenslauf, Anschreiben, Stellenanzeige, Ihre Antworten. Keine Fotos.',
  saveConfirmed: 'Gespeichert',
  saveConfirmedLink: 'In Meine Bewerbungen öffnen',
  saveCancelCta: 'Abbrechen',
  saveTitleAriaLabel: 'Titel der Bewerbung',
  saveRenameAria: 'Titel bearbeiten',
  libraryTitle: 'Meine Bewerbungen',
  libraryEmptyStatus: 'Noch keine gespeicherten Bewerbungen',
  libraryEmptyBody:
    'Wenn Sie eine fertige Bewerbung speichern, können Sie sie hier wieder öffnen, umbenennen und als Vorlage für die nächste Stelle duplizieren.',
  libraryEmptyCta: 'Bewerbung erstellen',
  libraryNewCta: 'Neue Bewerbung',
  libraryMenuOpen: 'Öffnen',
  libraryMenuDuplicate: 'Neue Bewerbung aus dieser',
  libraryMenuRename: 'Umbenennen',
  libraryMenuDelete: 'Löschen',
  libraryMenuAriaLabel: (title) => `Weitere Aktionen für ${title}`,
  libraryRenameHelper: 'Enter speichern · Esc abbrechen',
  libraryFilterPlaceholder: 'Nach Titel oder Firma filtern',
  libraryReadonlyBadge: 'Nur Lesen',
  libraryReadonlyBanner:
    'Ihre neueste Bewerbung bleibt bearbeitbar. Ältere sind schreibgeschützt: ansehen, laden, duplizieren, exportieren und löschen geht immer.',
  libraryEditableBadge: 'Bearbeitbar',
  libraryStorageFree: '1 von 1 gespeichert · Kostenlos',
  libraryFooterContents:
    'Ihren CV-Text, den Lebenslauf, das Anschreiben, die Stellenanzeige und Ihre Antworten. Keine Fotos.',
  cvsAssignLabel: 'Lebenslauf zuordnen',
  cvsAttachOption: 'An bestehenden Lebenslauf anhängen',
  cvsNewOption: 'Als neuen Lebenslauf speichern',
  cvsNewOptionHint: 'Zum Beispiel für eine zweite Sprache oder Fachrichtung.',
  cvsSnapshotNote:
    'Bewerbungen bleiben Momentaufnahmen: spätere Änderungen am Lebenslauf wirken nicht rückwirkend.',
  cvsAttachMeta: (date, count) =>
    count === 1 ? `Stand ${date} · in 1 Bewerbung` : `Stand ${date} · in ${count} Bewerbungen`,
  gateEyebrow: 'Speicherplatz',
  gateStorageStatus: '1 von 1 Bewerbung gespeichert.',
  gateTitle: 'Ihr kostenloser Speicherplatz ist belegt.',
  gateSubtitle:
    'Ihr Dokument bleibt vollständig und kostenlos, begrenzt ist nur, wie viel wir für Sie speichern.',
  gatePassName: 'Bewerbungsphase-Pass',
  gateRecommendedBadge: 'Empfohlen',
  gatePassPriceUnit: 'einmalig · 30 Tage',
  gatePassFeature1: 'Unbegrenzte Bewerbungspakete: PDF und Feinschliff inklusive',
  gatePassFeature2: 'Speicher für 25 Bewerbungen',
  gatePassCta: 'Pass kaufen',
  gatePassHonest: 'Läuft automatisch aus. Keine Kündigung nötig.',
  gatePlusName: 'ScanReady Plus',
  gatePlannedBadge: 'Geplant',
  gatePlusPrice: '5,99 €',
  gatePlusPriceUnit: 'pro Monat',
  gatePlusFeature1: 'Alles aus dem Pass, fortlaufend',
  gatePlusFeature2: 'Unbegrenzter Speicher',
  gatePlusCta: 'Benachrichtigen lassen',
  gatePlusHonest: 'Monatlich kündbar, Kündigungsbutton inklusive, Erinnerung vor jeder Verlängerung.',
  gateAlternative: 'Oder: gespeicherte Bewerbung löschen und den Platz neu belegen. Kostenlos, jederzeit.',
  gateLaterCta: 'Später',
  gateDismissAria: 'Hinweis schließen',
  gateAnchorTitle: 'Sie kaufen einzeln. Die Bewerbungsphase rechnet anders.',
  gateAnchorLineItem: (date) => `Bewerbungspaket · ${date}`,
  gateAnchorSumLabel: (count) => (count === 2 ? 'Zwei Pakete gekauft' : `${count} Pakete gekauft`),
  gateAnchorPassLabel: 'Der Pass · alle Bewerbungen, 30 Tage',
  gateAnchor: (count, sumFormatted, passFormatted) =>
    `${count === 2 ? 'Zwei Pakete gekauft' : `${count} Pakete gekauft`} = ${sumFormatted}. Der Pass kostet ${passFormatted} und deckt Ihre ganze Bewerbungsphase.`,
  gateAnchorPassCta: (priceFormatted) => `Pass kaufen · ${priceFormatted}`,
  gateAnchorEndsAutomatically: 'Endet automatisch',
  kontoLink: 'Konto',
  savedApplicationsHeading: 'Gespeicherte Bewerbungen',
  savedApplicationsUpdated: (date) => `Aktualisiert ${date}`,
  savedApplicationsReadOnlyBadge: 'Nur lesbar',
  savedApplicationsOpen: 'Öffnen',
  savedApplicationsEmpty: 'Noch keine gespeicherten Bewerbungen.',
  kontoDisabledNotice: 'Konten sind derzeit noch nicht verfügbar.',
  kontoSignInIntro: 'Melden Sie sich an, um Bewerbungen zu speichern und Ihr Abonnement zu verwalten.',
  kontoSavedHeading: 'Gespeicherte Bewerbungen',
  kontoSavedHint: 'Eine gespeicherte Bewerbung öffnen Sie im Tool unter /app.',
  kontoDeleteConfirm: 'Diese gespeicherte Bewerbung löschen?',
  kontoDeleteCta: 'Löschen',
  kontoSubscriptionHeading: 'Abonnement',
  kontoSubscriptionActive: (date) => `Aktiv – verlängert sich/endet am ${date}`,
  kontoSubscriptionNone: 'Kein aktives Abonnement.',
  kontoSubscribeCta: 'Abonnieren',
  kontoSubscribeError: 'Das Abonnement ist derzeit nicht verfügbar.',
  kontoCancelLink: 'Abonnement kündigen',
  kontoDangerHeading: 'Gefahrenzone',
  kontoDeleteAccountCta: 'Konto löschen',
  kontoDeleteAccountConfirm:
    'Damit werden Ihr Konto und alle gespeicherten Bewerbungen unwiderruflich gelöscht (DSGVO Art. 17). Dies kann nicht rückgängig gemacht werden. Fortfahren?',
  kontoDeleteAccountWorking: 'Wird gelöscht …',
  kontoDeleteAccountError: 'Konto konnte nicht gelöscht werden. Bitte erneut versuchen.',
  kontoLoading: 'Wird geladen …',
} satisfies Dict

const DICTIONARIES: Record<UILang, Dict> = { en, de }

// ---------------------------------------------------------------------------
// Context + provider
// ---------------------------------------------------------------------------

type LangContextValue = {
  lang: UILang
  setLang: (lang: UILang) => void
  t: Dict
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<UILang>('en')

  // Hydration-safe: read localStorage only after mount, so server render and
  // first client render both use the 'en' default and never mismatch. This is the
  // standard pattern for syncing from a browser-only API post-hydration; there is no
  // alternative that avoids a setState here, so the lint rule is suppressed narrowly.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === 'en' || stored === 'de') setLangState(stored)
    } catch {
      // localStorage unavailable (private mode, etc.) – silently keep default
    }
  }, [])

  const setLang = useCallback((next: UILang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore write failures
    }
  }, [])

  return (
    <LangContext.Provider value={{ lang, setLang, t: DICTIONARIES[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within a LangProvider')
  return ctx
}
