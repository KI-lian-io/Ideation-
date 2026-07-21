import React from 'react';

export type NormTickerItem = string | { from: string; to: string };

export interface NormTickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Norm facts and before→after pairs. Pairs render with a green arrow. Sensible German-norm defaults included. */
  items?: NormTickerItem[];
  /** Marquee duration. Default var(--dur-ticker) 36s; use 30s on mobile. */
  duration?: string;
  style?: React.CSSProperties;
}

/** Infinite mono-voice marquee of norm conversions on a surface-soft hairline band. One per page, under the hero. */
export function NormTicker(props: NormTickerProps): JSX.Element;
