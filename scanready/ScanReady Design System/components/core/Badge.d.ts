import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** discount=mint pill, required=error mono chip, type=paper mono, tag=blue, warn=amber, success=soft mint, neutral=paper */
  tone?: 'discount' | 'required' | 'type' | 'tag' | 'warn' | 'success' | 'neutral';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Small status/label chip. Pill for soft tones; small-radius mono for required/type doc badges. */
export function Badge(props: BadgeProps): JSX.Element;
