import React from 'react';

export interface DocumentMockupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Mono eyebrow kicker above the document title. */
  kicker?: string;
  /** Serif document name (e.g. "Lebenslauf — Max Mustermann"). */
  title?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** The single shadowed element — a framed preview of the generated document in the reading-serif voice. */
export function DocumentMockup(props: DocumentMockupProps): JSX.Element;
