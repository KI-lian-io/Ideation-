import React from 'react';

/**
 * ScanReady AnnotationPin — the small numbered green circle that marks a
 * normalization on the document and links it to its NormNote in the margin
 * rail. Same number on the sheet and on the note.
 */
export function AnnotationPin({ n, size = 18, style = {}, ...rest }) {
  return (
    <span
      style={{
        height: `${size}px`,
        width: `${size}px`,
        borderRadius: 'var(--radius-full)',
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
        fontFamily: 'var(--font-mono)',
        fontSize: `${Math.round(size * 0.55)}px`,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      {n}
    </span>
  );
}
