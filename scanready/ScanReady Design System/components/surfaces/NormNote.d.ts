import React from 'react';

export interface NormNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Bold lead-in label. Defaults to "Norm note". Pass "" to hide. */
  label?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Annotation chip explaining a normalization (DIN date, "Present" → "heute"). Accent-tint wash. */
export function NormNote(props: NormNoteProps): JSX.Element;
