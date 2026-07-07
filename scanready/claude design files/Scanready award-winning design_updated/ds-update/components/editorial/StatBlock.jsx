import React from 'react';

/**
 * ScanReady StatBlock — oversized display-serif numeral in accent green with a
 * short sans caption. Rows of three on the accent-tint stat band.
 */
export function StatBlock({ value, unit, children, style = {}, ...rest }) {
  return (
    <div style={style} {...rest}>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '96px',
          lineHeight: 1,
          fontWeight: 600,
          letterSpacing: '-2px',
          color: 'var(--accent)',
        }}
      >
        {value}
        {unit && <span style={{ fontSize: '56px', letterSpacing: 0 }}>&nbsp;{unit}</span>}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '15px',
          lineHeight: 1.55,
          color: 'var(--charcoal)',
          margin: '16px 0 0',
          maxWidth: '30ch',
        }}
      >
        {children}
      </p>
    </div>
  );
}
