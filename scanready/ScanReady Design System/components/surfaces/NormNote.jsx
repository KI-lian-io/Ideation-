import React from 'react';

/**
 * ScanReady NormNote — the annotation chip that explains a normalization the system made
 * to the document (DIN date format, "Present" → "heute", etc). Accent-tint wash, hairline, 8px.
 */
export function NormNote({ label = 'Norm note', children, style = {}, ...rest }) {
  return (
    <div
      style={{
        background: 'var(--accent-tint)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-sm)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-body-sm)',
        lineHeight: 'var(--lh-body-sm)',
        color: 'var(--ink-soft)',
        ...style,
      }}
      {...rest}
    >
      {label && <strong style={{ fontWeight: 'var(--fw-semibold)' }}>{label}: </strong>}
      {children}
    </div>
  );
}
