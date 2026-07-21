import React from 'react';

const DEFAULT_ITEMS = [
  { from: 'Mar 2021 – Present', to: '03/2021 – heute' },
  { from: 'Fluent', to: 'Verhandlungssicher' },
  'DIN 5008',
  'Foto optional · AGG',
  { from: 'Skills', to: 'IT-Kenntnisse · Fachkenntnisse' },
  'Zwei Seiten, nicht eine',
];

/**
 * ScanReady NormTicker — the infinite marquee of norm conversions (before → after
 * pairs and plain norm facts) in the mono voice, on a surface-soft hairline band.
 * One per page, directly under the hero.
 */
export function NormTicker({ items = DEFAULT_ITEMS, duration = 'var(--dur-ticker)', style = {}, ...rest }) {
  const renderItem = (it, i) => (
    <React.Fragment key={i}>
      <span>
        {typeof it === 'string' ? (
          it
        ) : (
          <>
            {it.from} <span style={{ color: 'var(--accent)' }}>→</span> {it.to}
          </>
        )}
      </span>
      <span style={{ color: 'var(--eyebrow)' }}>·</span>
    </React.Fragment>
  );
  const row = (key) => (
    <div
      key={key}
      aria-hidden={key === 2 ? 'true' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
        paddingRight: '40px',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--slate)',
        whiteSpace: 'nowrap',
      }}
    >
      {items.map(renderItem)}
    </div>
  );
  return (
    <div
      style={{
        borderTop: '1px solid var(--hairline)',
        borderBottom: '1px solid var(--hairline)',
        background: 'var(--surface-soft)',
        overflow: 'hidden',
        padding: '12px 0',
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', width: 'max-content', animation: `sr-marquee ${duration} linear infinite` }}>
        {row(1)}
        {row(2)}
      </div>
    </div>
  );
}
