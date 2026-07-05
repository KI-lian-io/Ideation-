import React from 'react';

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Override the default taupe — e.g. on-dark contexts. */
  color?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** The signature mono-uppercase-taupe micro-label. Sits above headlines and section openers. */
export function Eyebrow(props: EyebrowProps): JSX.Element;
