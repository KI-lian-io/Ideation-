import React from 'react';
import { Eyebrow } from '../core/Eyebrow.jsx';

/**
 * ScanReady SidebarNav — docs sidebar. Sections with mono-taupe headers; active item gets paper fill.
 * sections: [{ title, items: [{ id, label }] }]
 */
export function SidebarNav({ sections = [], value, onSelect, style = {} }) {
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: 'var(--sidebar-width)', ...style }}>
      {sections.map((sec, si) => (
        <div key={si} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {sec.title && (
            <div style={{ padding: '8px 12px 4px' }}>
              <Eyebrow>{sec.title}</Eyebrow>
            </div>
          )}
          {sec.items.map((it) => {
            const on = it.id === value;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onSelect && onSelect(it.id)}
                style={{
                  textAlign: 'left',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--fs-body-sm)',
                  fontWeight: on ? 'var(--fw-medium)' : 'var(--fw-regular)',
                  color: on ? 'var(--ink)' : 'var(--steel)',
                  background: on ? 'var(--surface)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  transition: 'background-color var(--dur-fast) var(--ease-standard)',
                }}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
