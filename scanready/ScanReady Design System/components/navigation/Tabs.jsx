import React from 'react';

/**
 * ScanReady Tabs — two styles. underline (segmented, ink bottom-border) and pill (navy fill active).
 */
export function Tabs({ items = [], value, onChange, variant = 'underline', style = {} }) {
  const [internal, setInternal] = React.useState(items[0]?.id);
  const active = value !== undefined ? value : internal;
  const select = (id) => {
    if (value === undefined) setInternal(id);
    onChange && onChange(id);
  };

  if (variant === 'pill') {
    return (
      <div style={{ display: 'inline-flex', gap: 'var(--space-xs)', flexWrap: 'wrap', ...style }}>
        {items.map((it) => {
          const on = it.id === active;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => select(it.id)}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-body-sm)',
                fontWeight: 'var(--fw-medium)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                background: on ? 'var(--primary)' : 'var(--canvas)',
                color: on ? 'var(--on-primary)' : 'var(--steel)',
                border: `1px solid ${on ? 'var(--primary)' : 'var(--hairline)'}`,
                transition: 'background-color var(--dur-fast) var(--ease-standard)',
              }}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--space-lg)', borderBottom: '1px solid var(--hairline)', ...style }}>
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => select(it.id)}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-body-sm)',
              fontWeight: 'var(--fw-medium)',
              padding: '12px 2px',
              marginBottom: '-1px',
              background: 'none',
              cursor: 'pointer',
              color: on ? 'var(--ink)' : 'var(--steel)',
              border: 'none',
              borderBottom: `2px solid ${on ? 'var(--ink)' : 'transparent'}`,
              transition: 'color var(--dur-fast) var(--ease-standard)',
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
