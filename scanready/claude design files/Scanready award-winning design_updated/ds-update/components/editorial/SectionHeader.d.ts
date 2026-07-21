import React from 'react';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Folio number, zero-padded ("01"…"05"). Rendered dimmed before the eyebrow. */
  index?: string;
  /** The mono uppercase eyebrow, 1–4 words ("Pathways", "How it works"). */
  eyebrow: string;
  /** Display-serif headline (sentence case). */
  title: React.ReactNode;
  align?: 'left' | 'center';
  /** Headline measure. Default '20ch' when left-aligned. */
  maxWidth?: string;
  style?: React.CSSProperties;
}

/** Folio section head: dimmed mono index + eyebrow, display-serif headline. Opens every numbered marketing band. */
export function SectionHeader(props: SectionHeaderProps): JSX.Element;
