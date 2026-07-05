import React from 'react';

/**
 * ScanReady Input — warm canvas field, hairline border, 2px deep-green focus ring (the activation signal).
 * - multiline: renders a <textarea> (the Anschreiben / job-posting field)
 * - serif: switches the value to the reading-serif document voice (generated text)
 * - maxLength + showCounter: renders a right-aligned "128 / 2.000" counter (German thousands dot)
 */
export function Input({
  label,
  hint,
  error,
  required = false,
  iconLeft = null,
  multiline = false,
  serif = false,
  rows = 4,
  maxLength,
  showCounter = false,
  value,
  defaultValue,
  onChange,
  style = {},
  id,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const val = isControlled ? value : internal;
  const count = (val ?? '').toString().length;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const handleChange = (e) => {
    if (!isControlled) setInternal(e.target.value);
    onChange && onChange(e);
  };

  const fieldFont = serif ? 'var(--font-serif-text)' : 'var(--font-sans)';
  const fieldFs = serif ? 'var(--fs-doc)' : 'var(--fs-body-md)';
  const fieldLh = serif ? 'var(--lh-doc)' : 1.4;

  const fmt = (n) => n.toLocaleString('de-DE');

  const innerStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: fieldFont,
    fontSize: fieldFs,
    lineHeight: fieldLh,
    color: serif ? 'var(--ink)' : 'var(--charcoal)',
    width: '100%',
    resize: multiline ? 'vertical' : undefined,
    padding: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label && (
        <label htmlFor={inputId} style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {label}
          {required && <span style={{ color: 'var(--brand-error)' }}>*</span>}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: '8px',
          minHeight: multiline ? undefined : '40px',
          padding: multiline ? '12px 14px' : '0 12px',
          background: 'var(--canvas)',
          borderRadius: 'var(--radius-sm)',
          border: error
            ? '2px solid var(--brand-error)'
            : focused
            ? '2px solid var(--accent)'
            : '1px solid var(--hairline)',
          transition: 'border-color var(--dur-fast) var(--ease-standard)',
        }}
      >
        {iconLeft}
        {multiline ? (
          <textarea
            id={inputId}
            rows={rows}
            maxLength={maxLength}
            value={isControlled ? value : undefined}
            defaultValue={isControlled ? undefined : defaultValue}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={innerStyle}
            {...rest}
          />
        ) : (
          <input
            id={inputId}
            maxLength={maxLength}
            value={isControlled ? value : undefined}
            defaultValue={isControlled ? undefined : defaultValue}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ ...innerStyle, height: '38px' }}
            {...rest}
          />
        )}
      </div>
      {(hint || error || showCounter) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: error ? 'var(--brand-error)' : 'var(--stone)' }}>
            {error || hint}
          </span>
          {showCounter && (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', color: 'var(--body)', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
              {fmt(count)}{maxLength ? ` / ${fmt(maxLength)}` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
