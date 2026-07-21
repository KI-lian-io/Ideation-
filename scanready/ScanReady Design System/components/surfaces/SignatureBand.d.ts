import React from 'react';

export interface SignatureBandProps extends React.HTMLAttributes<HTMLElement> {
  /** Optional mono eyebrow above the headline. */
  eyebrow?: string;
  /** Serif headline (the statement). */
  title?: string;
  /** Show the accent lock dot. Default true. */
  lock?: boolean;
  /** Text alignment. Default 'center'. */
  align?: 'center' | 'left';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** The navy color-block signature band — one trust/closing statement, serif headline, accent lock dot. */
export function SignatureBand(props: SignatureBandProps): JSX.Element;
