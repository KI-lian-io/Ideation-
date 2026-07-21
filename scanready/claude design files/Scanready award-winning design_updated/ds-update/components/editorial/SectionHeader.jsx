import React from 'react';

/**
 * ScanReady SectionHeader — the folio head that opens every marketing band:
 * dimmed mono index + eyebrow on one baseline, display-serif headline below.
 * Gives a long page its "keeps giving me a reason to keep scrolling" rhythm.
 */
export function SectionHeader({ index, eyebrow, title, align = 'left', maxWidth, style = {}, ...rest }) {
  const centered = align === 'center';
  return (
    <div style={{ textAlign: centered ? 'center' : 'left', ...style }} {...rest}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: centered ? 'center' : 'flex-start',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {index && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.18em',
              color: 'var(--eyebrow)',
              opacity: 0.6,
            }}
          >
            {index}
          </span>
        )}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-eyebrow)',
            fontWeight: 'var(--fw-medium)',
            letterSpacing: 'var(--ls-eyebrow)',
            textTransform: 'uppercase',
            color: 'var(--eyebrow)',
          }}
        >
          {eyebrow}
        </span>
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '44px',
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: '-1px',
          color: 'var(--ink)',
          margin: 0,
          maxWidth: maxWidth || (centered ? undefined : '20ch'),
          marginLeft: centered ? 'auto' : undefined,
          marginRight: centered ? 'auto' : undefined,
        }}
      >
        {title}
      </h2>
    </div>
  );
}
