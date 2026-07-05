import React from 'react';

/**
 * ScanReady Button — editorial 6px corners (no longer full-pill).
 * Variants: primary (navy), accent (deep green — the single brand CTA),
 * onDark (white-on-band), secondary (hairline outline), ghost (quiet tertiary).
 * Feedback is color + a restrained scale(0.97) press — no hover glow, no bounce.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--fs-button)',
    fontWeight: 'var(--fw-semibold)',
    lineHeight: 'var(--lh-button)',
    letterSpacing: 0,
    borderRadius: 'var(--radius-button)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
    transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
    transition: 'background-color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
    WebkitTapHighlightColor: 'transparent',
  };

  const sizes = {
    sm: { padding: '7px 14px' },
    md: { padding: '10px 18px' },
    lg: { padding: '13px 24px', fontSize: '15px' },
  };
  if (variant === 'ghost') sizes.md.padding = '8px 12px';

  const variants = {
    primary: { background: pressed ? 'var(--charcoal)' : 'var(--primary)', color: 'var(--on-primary)' },
    accent: { background: pressed ? 'var(--accent-deep)' : 'var(--accent)', color: 'var(--on-primary)' },
    onDark: { background: 'var(--on-dark)', color: 'var(--primary)' },
    secondary: { background: pressed ? 'var(--surface)' : 'transparent', color: 'var(--ink)', borderColor: 'var(--hairline)' },
    ghost: { background: pressed ? 'var(--surface)' : 'transparent', color: 'var(--steel)' },
  };

  const disabledStyle = disabled
    ? { background: 'var(--hairline)', color: 'var(--muted)', borderColor: 'transparent', transform: 'scale(1)' }
    : {};

  const release = () => setPressed(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      style={{ ...base, ...sizes[size], ...variants[variant], ...disabledStyle, ...style }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
