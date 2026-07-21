import React from 'react';

/**
 * ScanReady ScanSweep — the signature green scan light that passes over a document.
 * Absolutely-positioned overlay; the host element must be position:relative with
 * overflow hidden (or rely on this overlay's own overflow:hidden + the host radius).
 * Decorative only (aria-hidden) — never the sole progress signal.
 */
export function ScanSweep({
  variant = 'loop',      // 'loop' (sr-scan) | 'cycle' (sr-scan-cycle, synced to the 11s convert cycle)
  duration,              // e.g. '2.2s' — defaults: loop → var(--dur-scan), cycle → var(--dur-convert)
  height = '36%',        // height of the light band
  intensity = 'soft',    // 'soft' (resting) | 'strong' (actively working)
  delay = '0s',
  style = {},
  ...rest
}) {
  const tint = intensity === 'strong' ? 'var(--scan-tint-strong)' : 'var(--scan-tint)';
  const rule = intensity === 'strong' ? 'var(--scan-rule-strong)' : 'var(--scan-rule)';
  const name = variant === 'cycle' ? 'sr-scan-cycle' : 'sr-scan';
  const dur = duration || (variant === 'cycle' ? 'var(--dur-convert)' : 'var(--dur-scan)');
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', ...style }}
      {...rest}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height,
          background: `linear-gradient(to bottom, transparent 0%, ${tint} 45%, ${tint} 55%, transparent 100%)`,
          borderTop: `2px solid ${rule}`,
          animation: `${name} ${dur} var(--ease-scan) infinite`,
          animationDelay: delay,
        }}
      />
    </div>
  );
}
