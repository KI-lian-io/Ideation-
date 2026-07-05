import React from 'react';

/**
 * ScanReady Eyebrow — the signature mono, taupe, uppercase 0.18em micro-label.
 * The single most identifying brand tell. Never body, never a CTA.
 */
export function Eyebrow({ children, color = 'var(--eyebrow)', style = {}, ...rest }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-eyebrow)',
        fontWeight: 'var(--fw-medium)',
        lineHeight: 'var(--lh-eyebrow)',
        letterSpacing: 'var(--ls-eyebrow)',
        textTransform: 'uppercase',
        color,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
