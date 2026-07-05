import React from 'react';

export interface PricingCardProps {
  name: string;
  /** Display price, e.g. "$0", "$29". */
  price: string;
  period?: string;
  description?: string;
  /** Feature list — each gets a mint check. */
  features?: string[];
  cta?: string;
  /** Featured tier: 2px mint border + faint mint glow + mint CTA. */
  featured?: boolean;
  /** Override the corner badge label (featured defaults to "Popular"). */
  badge?: string;
  onSelect?: () => void;
  style?: React.CSSProperties;
}

/**
 * Pricing tier card. Serif price, mint checkmarks; featured tier is the only place the brand glow appears.
 * @startingPoint section="Surfaces" subtitle="Pricing tiers — featured tier glows mint" viewport="760x440"
 */
export function PricingCard(props: PricingCardProps): JSX.Element;
