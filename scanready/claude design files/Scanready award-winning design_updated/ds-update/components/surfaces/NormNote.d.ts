import React from 'react';

export interface NormNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Bold lead-in label (inline chip form only). Defaults to "Norm note". Pass "" to hide. */
  label?: string;
  /** Annotation number — switches to the pinned margin-card form; matches the AnnotationPin on the sheet. */
  n?: number | string;
  /** Mono uppercase kicker for the margin-card form ("Datum · DIN 5008"). */
  kicker?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Annotation explaining a normalization. Inline chip by default; pass n/kicker for the pinned margin card. */
export function NormNote(props: NormNoteProps): JSX.Element;
