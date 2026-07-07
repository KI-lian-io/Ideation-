import React from 'react';

export interface ScanSweepProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'loop' = free-running scan (parsing, streaming, hero). 'cycle' = synced to the 11s EN→DE convert cycle. */
  variant?: 'loop' | 'cycle';
  /** CSS duration. Defaults: loop → var(--dur-scan) 4.5s, cycle → var(--dur-convert) 11s. Use var(--dur-scan-parse) 2.2s while actively working. */
  duration?: string;
  /** Height of the light band. Default '36%'. */
  height?: string;
  /** 'soft' for resting/hero, 'strong' while the system is working. */
  intensity?: 'soft' | 'strong';
  /** animation-delay, e.g. '0.5s'. */
  delay?: string;
  style?: React.CSSProperties;
}

/** The signature green scan light passing over a document sheet. Host must be position:relative. Decorative (aria-hidden). */
export function ScanSweep(props: ScanSweepProps): JSX.Element;
