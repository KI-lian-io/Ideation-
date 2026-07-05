import React from 'react';

export interface SidebarSection {
  title?: string;
  items: { id: string; label: string }[];
}
export interface SidebarNavProps {
  sections: SidebarSection[];
  /** Active item id. */
  value?: string;
  onSelect?: (id: string) => void;
  style?: React.CSSProperties;
}

/** Documentation sidebar — mono-taupe section headers, paper-fill active item, 6px radius rows. */
export function SidebarNav(props: SidebarNavProps): JSX.Element;
