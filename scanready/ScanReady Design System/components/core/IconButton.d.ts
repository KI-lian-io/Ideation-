import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** rounded = md radius, circle = full pill. */
  shape?: 'rounded' | 'circle';
  disabled?: boolean;
  /** Accessible label (icon-only control). */
  label?: string;
  /** The icon element (img/svg). */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Icon-only square/round control for toolbars and compact actions. */
export function IconButton(props: IconButtonProps): JSX.Element;
