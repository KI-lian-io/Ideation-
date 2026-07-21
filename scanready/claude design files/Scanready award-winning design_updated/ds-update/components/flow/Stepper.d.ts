import React from 'react';

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Step labels. Defaults to the converter flow: Lebenslauf, Questions, Anschreiben. */
  steps?: string[];
  /** 0-based index of the current step. Steps before it render done (accent). */
  current?: number;
  /** Numbers-only variant for mobile app bars. */
  compact?: boolean;
  style?: React.CSSProperties;
}

/** Mono-voice flow indicator: status dots joined by hairlines. Lives centered in the converter app bar. */
export function Stepper(props: StepperProps): JSX.Element;
