import React from 'react';

/**
 * ScanReady PullQuote — centered editorial pull quote in the reading serif,
 * green opening quote, short hairline rules above and below.
 * For the one evidence moment per page (recruiter-study stat, key claim).
 */
export function PullQuote({ children, attribution, style = {}, ...rest }) {
  const rule = (m) => (
    <div style={{ height: '1px', width: '64px', background: 'rgba(27,36,48,0.3)', margin: m }} />
  );
  return (
    <figure style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', ...style }} {...rest}>
      {rule('0 auto 36px')}
      <blockquote
        style={{
          fontFamily: 'var(--font-serif-text)',
          fontSize: '34px',
          lineHeight: 1.35,
          color: 'var(--ink)',
          margin: 0,
          textIndent: '-0.45em',
        }}
      >
        <span style={{ color: 'var(--accent)' }}>&ldquo;</span>
        {children}
      </blockquote>
      {attribution && (
        <figcaption
          style={{
            marginTop: '20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--stone)',
          }}
        >
          {attribution}
        </figcaption>
      )}
      {rule('36px auto 0')}
    </figure>
  );
}
