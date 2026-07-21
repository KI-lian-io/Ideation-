import React from 'react';

export interface StatBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The numeral ("61%", "8"). Keep it short and concrete. */
  value: React.ReactNode;
  /** Optional smaller unit suffix ("sec"). */
  unit?: string;
  /** One-sentence caption grounding the number. */
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** Oversized accent-green display numeral + sans caption. Rows of three on the accent-tint band. */
export function StatBlock(props: StatBlockProps): JSX.Element;
