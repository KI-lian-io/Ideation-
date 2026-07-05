import React from 'react';

/**
 * ScanReady Tag — quiet paper pill for filters/categories; optional removable.
 * variant="skill" renders the accent-soft skill chip (green-on-soft).
 */
export function Tag({ children, onRemove, active = false, variant = 'default', style = {}, ...rest }) {
  const skin = variant === 'skill'
    ? { background: 'var(--accent-soft)', color: 'var(--accent-deep)', border: '1px solid transparent' }
    : { background: active ? 'var(--primary)' : 'var(--canvas)', color: active ? 'var(--on-primary)' : 'var(--steel)', border: `1px solid ${active ? 'var(--primary)' : 'var(--hairline)'}` };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        ...skin,
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-body-sm)',
        fontWeight: 'var(--fw-medium)',
        borderRadius: 'var(--radius-full)',
        padding: '6px 14px',
        ...style,
      }}
      {...rest}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          style={{ display: 'inline-flex', border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: 'inherit', opacity: 0.7 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      )}
    </span>
  );
}
