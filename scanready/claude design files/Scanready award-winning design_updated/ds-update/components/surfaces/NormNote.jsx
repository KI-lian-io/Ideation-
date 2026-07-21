import React from 'react';

/**
 * ScanReady NormNote — the annotation that explains a normalization the system
 * made (DIN date format, "Present" → "heute", etc). Accent-tint wash, hairline.
 *
 * Two forms:
 * - inline chip (legacy): bold lead-in label + text, e.g. inside a document card.
 * - pinned margin card: pass `n` (and optionally `kicker`) — numbered pin +
 *   mono kicker + body, for the margin rail beside a document sheet.
 */
export function NormNote({ label = 'Norm note', n, kicker, children, style = {}, ...rest }) {
  const base = {
    background: 'var(--accent-tint)',
    border: '1px solid var(--hairline)',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--fs-body-sm)',
    lineHeight: 'var(--lh-body-sm)',
    color: 'var(--ink-soft)',
  };

  if (n == null && !kicker) {
    return (
      <div style={{ ...base, padding: 'var(--space-sm)', ...style }} {...rest}>
        {label && <strong style={{ fontWeight: 'var(--fw-semibold)' }}>{label}: </strong>}
        {children}
      </div>
    );
  }

  return (
    <div style={{ ...base, padding: '16px 18px', display: 'flex', gap: '12px', ...style }} {...rest}>
      {n != null && (
        <span
          style={{
            height: '18px',
            width: '18px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px',
          }}
        >
          {n}
        </span>
      )}
      <div>
        {kicker && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              fontWeight: 'var(--fw-medium)',
              marginBottom: '4px',
            }}
          >
            {kicker}
          </div>
        )}
        <p style={{ margin: 0 }}>{children}</p>
      </div>
    </div>
  );
}
