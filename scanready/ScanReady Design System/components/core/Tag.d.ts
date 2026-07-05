import React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Active (selected) fills navy. */
  active?: boolean;
  /** 'skill' renders the accent-soft skill chip; 'default' is the quiet paper pill. */
  variant?: 'default' | 'skill';
  /** When provided, renders a remove (×) affordance. */
  onRemove?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Quiet paper pill for filters / categories. Active fills navy; variant="skill" is the accent-soft chip. */
export function Tag(props: TagProps): JSX.Element;
