import React from 'react';

/**
 * ScanReady Stepper — the converter's flow indicator (1 Lebenslauf → 2 Questions
 * → 3 Anschreiben) in the mono voice: status dots joined by hairlines.
 * Done = filled accent, current = ink-outlined, upcoming = stone-outlined.
 */
export function Stepper({ steps = ['Lebenslauf', 'Questions', 'Anschreiben'], current = 0, compact = false, style = {}, ...rest }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '8px' : '14px',
        fontFamily: 'var(--font-mono)',
        fontSize: compact ? '10px' : '11px',
        letterSpacing: compact ? '0.14em' : '0.16em',
        textTransform: 'uppercase',
        ...style,
      }}
      {...rest}
    >
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        const color = state === 'done' ? 'var(--accent)' : state === 'current' ? 'var(--ink)' : 'var(--stone)';
        const dot =
          state === 'done'
            ? { background: 'var(--accent)' }
            : state === 'current'
              ? { border: '1.5px solid var(--ink)' }
              : { border: '1px solid var(--stone)' };
        return (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ height: '1px', width: compact ? '14px' : '28px', background: 'var(--hairline)' }} />}
            <span style={{ display: 'flex', alignItems: 'center', gap: compact ? '4px' : '6px', color }}>
              <span style={{ height: compact ? '5px' : '6px', width: compact ? '5px' : '6px', borderRadius: 'var(--radius-full)', boxSizing: 'border-box', ...dot }} />
              {i + 1}{compact ? '' : ` ${label}`}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
