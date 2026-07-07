import React from 'react';

export interface AnnotationPinProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The annotation number — matches the pinned NormNote in the margin rail. */
  n: number | string;
  /** Diameter in px. Default 18; 15 on mobile. */
  size?: number;
  style?: React.CSSProperties;
}

/** Numbered green circle marking a normalization on the document; pairs with NormNote n. */
export function AnnotationPin(props: AnnotationPinProps): JSX.Element;
