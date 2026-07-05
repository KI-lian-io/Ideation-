import React from 'react';
import { Button } from '../core/Button.jsx';
import { Eyebrow } from '../core/Eyebrow.jsx';
import { Badge } from '../core/Badge.jsx';

/**
 * ScanReady PricingCard. Featured tier gets a 2px green border + faint green glow (the only glow).
 */
export function PricingCard({
  name,
  price,
  period = '/mo',
  description,
  features = [],
  cta = 'Get started',
  featured = false,
  badge,
  style = {},
  onSelect,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
        background: 'var(--canvas)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xxl)',
        border: featured ? '2px solid var(--accent)' : '1px solid var(--hairline)',
        boxShadow: featured ? 'var(--shadow-brand-glow)' : 'none',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow>{name}</Eyebrow>
        {(badge || featured) && <Badge tone="discount">{badge || 'Popular'}</Badge>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--fs-display-lg)', fontWeight: 'var(--fw-semibold)', lineHeight: 1, letterSpacing: 'var(--ls-display-lg)', color: 'var(--ink)' }}>{price}</span>
        {period && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body-sm)', color: 'var(--steel)' }}>{period}</span>}
      </div>
      {description && (
        <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-body-sm)', color: 'var(--slate)' }}>{description}</p>
      )}
      <Button variant={featured ? 'accent' : 'secondary'} onClick={onSelect} style={{ width: '100%' }}>{cta}</Button>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body-sm)', lineHeight: 'var(--lh-body-sm)', color: 'var(--charcoal)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-deep)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '3px', flexShrink: 0 }}><path d="M20 6 9 17l-5-5" /></svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
