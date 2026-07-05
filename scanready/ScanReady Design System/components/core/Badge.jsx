import React from 'react';

/**
 * ScanReady Badge — full-pill status/label chips.
 * tones: discount (green), required (error+eyebrow type), type (paper+mono), tag (blue), warn, success (green).
 */
export function Badge({ children, tone = 'neutral', style = {}, ...rest }) {
  const tones = {
    discount: { background: 'var(--accent)', color: 'var(--on-primary)', font: 'var(--font-sans)', weight: 'var(--fw-semibold)', size: 'var(--fs-caption)', radius: 'var(--radius-full)', tracking: 0, upper: 'none', pad: '2px 8px' },
    required: { background: 'var(--brand-error)', color: 'var(--on-dark)', font: 'var(--font-mono)', weight: 'var(--fw-medium)', size: 'var(--fs-eyebrow)', radius: 'var(--radius-sm)', tracking: 'var(--ls-eyebrow)', upper: 'uppercase', pad: '2px 6px' },
    type: { background: 'var(--surface)', color: 'var(--steel)', font: 'var(--font-mono)', weight: 'var(--fw-regular)', size: 'var(--fs-code-sm)', radius: 'var(--radius-sm)', tracking: 0, upper: 'none', pad: '2px 6px' },
    tag: { background: 'rgba(55,114,207,0.12)', color: 'var(--brand-tag)', font: 'var(--font-sans)', weight: 'var(--fw-medium)', size: 'var(--fs-caption)', radius: 'var(--radius-full)', tracking: 0, upper: 'none', pad: '2px 8px' },
    warn: { background: 'rgba(185,121,26,0.12)', color: 'var(--brand-warn)', font: 'var(--font-sans)', weight: 'var(--fw-medium)', size: 'var(--fs-caption)', radius: 'var(--radius-full)', tracking: 0, upper: 'none', pad: '2px 8px' },
    success: { background: 'var(--accent-soft)', color: 'var(--accent-deep)', font: 'var(--font-sans)', weight: 'var(--fw-medium)', size: 'var(--fs-caption)', radius: 'var(--radius-full)', tracking: 0, upper: 'none', pad: '2px 8px' },
    neutral: { background: 'var(--surface)', color: 'var(--steel)', font: 'var(--font-sans)', weight: 'var(--fw-medium)', size: 'var(--fs-caption)', radius: 'var(--radius-full)', tracking: 0, upper: 'none', pad: '2px 8px' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: t.background,
        color: t.color,
        fontFamily: t.font,
        fontWeight: t.weight,
        fontSize: t.size,
        letterSpacing: t.tracking,
        textTransform: t.upper,
        borderRadius: t.radius,
        padding: t.pad,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
