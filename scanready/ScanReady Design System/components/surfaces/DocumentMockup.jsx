import React from 'react';

/**
 * ScanReady DocumentMockup — the ONE shadowed element in the system. A framed preview of the
 * generated Lebenslauf / Anschreiben, rendered in the reading-serif document voice on warm card.
 * Use `title` for the serif document name and pass document body as children.
 */
export function DocumentMockup({ kicker, title, children, style = {}, ...rest }) {
  return (
    <div
      style={{
        background: 'var(--canvas)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-mockup)',
        padding: 'var(--space-xxl)',
        ...style,
      }}
      {...rest}
    >
      {kicker && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-eyebrow)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--eyebrow)', marginBottom: 'var(--space-sm)' }}>
          {kicker}
        </div>
      )}
      {title && (
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--fs-h4)', fontWeight: 'var(--fw-semibold)', lineHeight: 'var(--lh-h4)', color: 'var(--ink)' }}>
          {title}
        </div>
      )}
      <div style={{ fontFamily: 'var(--font-serif-text)', fontSize: 'var(--fs-doc)', lineHeight: 'var(--lh-doc)', color: 'var(--ink)', marginTop: 'var(--space-xs)' }}>
        {children}
      </div>
    </div>
  );
}
