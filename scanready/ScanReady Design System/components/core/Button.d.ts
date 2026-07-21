import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. primary=navy, accent=deep-green (single brand CTA), onDark=white-on-band, secondary=hairline outline, ghost=quiet tertiary. All share the editorial 6px corner. */
  variant?: 'primary' | 'accent' | 'onDark' | 'secondary' | 'ghost';
  /** Size of the button. */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Element rendered before the label (e.g. an icon img/svg). */
  iconLeft?: React.ReactNode;
  /** Element rendered after the label. */
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * ScanReady's editorial button — 6px corners, color + scale(0.97) press feedback, no hover glow.
 * Navy primary is the dominant CTA; deep-green accent is the single brand-emphasis CTA;
 * onDark inverts on the navy signature band; secondary is a hairline outline; ghost is the quiet tertiary.
 *
 * @dsCard group="Components" subtitle="Editorial 6px buttons — navy / green / outline / ghost" viewport="700x180"
 */
export function Button(props: ButtonProps): JSX.Element;
