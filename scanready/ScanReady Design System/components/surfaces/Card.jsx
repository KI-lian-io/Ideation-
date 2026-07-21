import React from 'react';

/**
 * ScanReady Card — flat warm surface, 12px radius, hairline border.
 * variants: base (canvas + border), feature (paper, no border), document (reading-serif paper).
 */
export function Card({ children, variant = 'base', style = {}, ...rest }) {
  const variants = {
    base: { background: 'var(--canvas)', border: '1px solid var(--hairline)', padding: 'var(--space-xl)', color: 'var(--charcoal)' },
    feature: { background: 'var(--surface)', border: 'none', padding: 'var(--space-xxl)', color: 'var(--charcoal)' },
    document: { background: 'var(--canvas)', border: '1px solid var(--hairline)', padding: 'var(--space-xl)', color: 'var(--ink)', fontFamily: 'var(--font-serif-text)', fontSize: 'var(--fs-doc)', lineHeight: 'var(--lh-doc)' },
  };
  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Optional Inter heading-4 card title helper. */
export function CardTitle({ children, style = {} }) {
  return (
    <h3 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-h4)', fontWeight: 'var(--fw-semibold)', lineHeight: 'var(--lh-h4)', color: 'var(--ink)', ...style }}>
      {children}
    </h3>
  );
}
