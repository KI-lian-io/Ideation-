import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** base=canvas+hairline, feature=paper no border, document=reading-serif paper (Lebenslauf/Anschreiben) */
  variant?: 'base' | 'feature' | 'document';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Flat content surface — 12px radius, warm hairline, no shadow. The brand's default container.
 * @dsCard group="Components" subtitle="Flat cards — base / feature / document" viewport="700x260"
 */
export function Card(props: CardProps): JSX.Element;
export function CardTitle(props: CardTitleProps): JSX.Element;
