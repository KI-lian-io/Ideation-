import React from 'react';

/**
 * ScanReady IconButton — square-ish icon-only control. Pill or md radius.
 * Pass an icon (img/svg) as children.
 */
export function IconButton({
  children,
  variant = 'secondary',
  size = 'md',
  shape = 'rounded',
  disabled = false,
  label,
  style = {},
  ...rest
}) {
  const dims = { sm: 32, md: 40, lg: 44 }[size];
  const variants = {
    primary: { background: 'var(--primary)', color: 'var(--on-primary)', borderColor: 'transparent' },
    secondary: { background: 'transparent', color: 'var(--steel)', borderColor: 'var(--hairline)' },
    ghost: { background: 'transparent', color: 'var(--steel)', borderColor: 'transparent' },
  };
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dims,
        height: dims,
        borderRadius: shape === 'circle' ? 'var(--radius-full)' : 'var(--radius-md)',
        border: '1px solid transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color var(--dur-fast) var(--ease-standard)',
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
