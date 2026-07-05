import React from 'react';

export interface TabItem {
  id: string;
  label: string;
}
export interface TabsProps {
  items: TabItem[];
  /** Controlled active id (omit for uncontrolled). */
  value?: string;
  onChange?: (id: string) => void;
  /** underline = segmented ink-border tabs; pill = navy-fill active pills. */
  variant?: 'underline' | 'pill';
  style?: React.CSSProperties;
}

/** Tab navigation. Underline style for sections; pill style for filters/toggles. */
export function Tabs(props: TabsProps): JSX.Element;
