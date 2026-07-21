import React from 'react';

export interface PullQuoteProps extends React.HTMLAttributes<HTMLElement> {
  /** The quote text — no closing quote mark; the green opening mark is added. */
  children: React.ReactNode;
  /** Mono uppercase source line ("DACH recruiter studies…"). */
  attribution?: string;
  style?: React.CSSProperties;
}

/** Centered reading-serif pull quote with green opening quote and hairline rules. One evidence moment per page. */
export function PullQuote(props: PullQuoteProps): JSX.Element;
