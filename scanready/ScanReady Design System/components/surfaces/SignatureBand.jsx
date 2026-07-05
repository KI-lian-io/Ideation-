import React from 'react';

/**
 * ScanReady SignatureBand — the navy color-block band. Carries a single trust/closing statement
 * (e.g. "Zero-retention, by design."). Serif headline, optional accent lock dot, centered by default.
 */
export function SignatureBand({
  eyebrow,
  title,
  children,
  lock = true,
  align = 'center',
  style = {},
  ...rest
}) {
  return (
    <section
      style={{
        background: 'linear-gradient(135deg, var(--band-from) 0%, var(--band-to) 100%)',
        color: 'var(--on-dark)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-section-sm)',
        textAlign: align,
        ...style,
      }}
      {...rest}
    >
      {lock && (
        <div
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent)',
            margin: align === 'center' ? '0 auto var(--space-md)' : '0 0 var(--space-md)',
          }}
        />
      )}
      {eyebrow && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-eyebrow)', letterSpacing: 'var(--ls-eyebrow)', textTransform: 'uppercase', color: 'var(--on-dark-soft)', marginBottom: 'var(--space-sm)' }}>
          {eyebrow}
        </div>
      )}
      {title && (
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-semibold)', lineHeight: 'var(--lh-h2)', color: 'var(--on-dark)' }}>
          {title}
        </h2>
      )}
      {children && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-subtitle)', lineHeight: 'var(--lh-subtitle)', color: 'var(--on-dark-soft)', maxWidth: '48ch', margin: align === 'center' ? 'var(--space-xs) auto 0' : 'var(--space-xs) 0 0' }}>
          {children}
        </p>
      )}
    </section>
  );
}
