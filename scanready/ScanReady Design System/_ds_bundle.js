/* @ds-bundle: {"format":3,"namespace":"ScanReadyDesignSystem_81c867","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Eyebrow","sourcePath":"components/core/Eyebrow.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SidebarNav","sourcePath":"components/navigation/SidebarNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"CardTitle","sourcePath":"components/surfaces/Card.jsx"},{"name":"DocumentMockup","sourcePath":"components/surfaces/DocumentMockup.jsx"},{"name":"NormNote","sourcePath":"components/surfaces/NormNote.jsx"},{"name":"PricingCard","sourcePath":"components/surfaces/PricingCard.jsx"},{"name":"SignatureBand","sourcePath":"components/surfaces/SignatureBand.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"f5afec7ef4ae","components/core/Button.jsx":"fbb5133a27aa","components/core/Eyebrow.jsx":"f52114390aab","components/core/IconButton.jsx":"fb9b2d067942","components/core/Tag.jsx":"6ec635c5a053","components/forms/Input.jsx":"405175711f69","components/navigation/SidebarNav.jsx":"5350dec3b336","components/navigation/Tabs.jsx":"202f110fbf1b","components/surfaces/Card.jsx":"e7c42200df1f","components/surfaces/DocumentMockup.jsx":"966cb31f9762","components/surfaces/NormNote.jsx":"4a56b6686d61","components/surfaces/PricingCard.jsx":"cf4a13971d36","components/surfaces/SignatureBand.jsx":"73f68b992e86"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ScanReadyDesignSystem_81c867 = window.ScanReadyDesignSystem_81c867 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScanReady Badge — full-pill status/label chips.
 * tones: discount (green), required (error+eyebrow type), type (paper+mono), tag (blue), warn, success (green).
 */
function Badge({
  children,
  tone = 'neutral',
  style = {},
  ...rest
}) {
  const tones = {
    discount: {
      background: 'var(--accent)',
      color: 'var(--on-primary)',
      font: 'var(--font-sans)',
      weight: 'var(--fw-semibold)',
      size: 'var(--fs-caption)',
      radius: 'var(--radius-full)',
      tracking: 0,
      upper: 'none',
      pad: '2px 8px'
    },
    required: {
      background: 'var(--brand-error)',
      color: 'var(--on-dark)',
      font: 'var(--font-mono)',
      weight: 'var(--fw-medium)',
      size: 'var(--fs-eyebrow)',
      radius: 'var(--radius-sm)',
      tracking: 'var(--ls-eyebrow)',
      upper: 'uppercase',
      pad: '2px 6px'
    },
    type: {
      background: 'var(--surface)',
      color: 'var(--steel)',
      font: 'var(--font-mono)',
      weight: 'var(--fw-regular)',
      size: 'var(--fs-code-sm)',
      radius: 'var(--radius-sm)',
      tracking: 0,
      upper: 'none',
      pad: '2px 6px'
    },
    tag: {
      background: 'rgba(55,114,207,0.12)',
      color: 'var(--brand-tag)',
      font: 'var(--font-sans)',
      weight: 'var(--fw-medium)',
      size: 'var(--fs-caption)',
      radius: 'var(--radius-full)',
      tracking: 0,
      upper: 'none',
      pad: '2px 8px'
    },
    warn: {
      background: 'rgba(185,121,26,0.12)',
      color: 'var(--brand-warn)',
      font: 'var(--font-sans)',
      weight: 'var(--fw-medium)',
      size: 'var(--fs-caption)',
      radius: 'var(--radius-full)',
      tracking: 0,
      upper: 'none',
      pad: '2px 8px'
    },
    success: {
      background: 'var(--accent-soft)',
      color: 'var(--accent-deep)',
      font: 'var(--font-sans)',
      weight: 'var(--fw-medium)',
      size: 'var(--fs-caption)',
      radius: 'var(--radius-full)',
      tracking: 0,
      upper: 'none',
      pad: '2px 8px'
    },
    neutral: {
      background: 'var(--surface)',
      color: 'var(--steel)',
      font: 'var(--font-sans)',
      weight: 'var(--fw-medium)',
      size: 'var(--fs-caption)',
      radius: 'var(--radius-full)',
      tracking: 0,
      upper: 'none',
      pad: '2px 8px'
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      background: t.background,
      color: t.color,
      fontFamily: t.font,
      fontWeight: t.weight,
      fontSize: t.size,
      letterSpacing: t.tracking,
      textTransform: t.upper,
      borderRadius: t.radius,
      padding: t.pad,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScanReady Button — editorial 6px corners (no longer full-pill).
 * Variants: primary (navy), accent (deep green — the single brand CTA),
 * onDark (white-on-band), secondary (hairline outline), ghost (quiet tertiary).
 * Feedback is color + a restrained scale(0.97) press — no hover glow, no bounce.
 */
function Button({
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
    WebkitTapHighlightColor: 'transparent'
  };
  const sizes = {
    sm: {
      padding: '7px 14px'
    },
    md: {
      padding: '10px 18px'
    },
    lg: {
      padding: '13px 24px',
      fontSize: '15px'
    }
  };
  if (variant === 'ghost') sizes.md.padding = '8px 12px';
  const variants = {
    primary: {
      background: pressed ? 'var(--charcoal)' : 'var(--primary)',
      color: 'var(--on-primary)'
    },
    accent: {
      background: pressed ? 'var(--accent-deep)' : 'var(--accent)',
      color: 'var(--on-primary)'
    },
    onDark: {
      background: 'var(--on-dark)',
      color: 'var(--primary)'
    },
    secondary: {
      background: pressed ? 'var(--surface)' : 'transparent',
      color: 'var(--ink)',
      borderColor: 'var(--hairline)'
    },
    ghost: {
      background: pressed ? 'var(--surface)' : 'transparent',
      color: 'var(--steel)'
    }
  };
  const disabledStyle = disabled ? {
    background: 'var(--hairline)',
    color: 'var(--muted)',
    borderColor: 'transparent',
    transform: 'scale(1)'
  } : {};
  const release = () => setPressed(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onPointerDown: () => !disabled && setPressed(true),
    onPointerUp: release,
    onPointerLeave: release,
    onPointerCancel: release,
    style: {
      ...base,
      ...sizes[size],
      ...variants[variant],
      ...disabledStyle,
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScanReady Eyebrow — the signature mono, taupe, uppercase 0.18em micro-label.
 * The single most identifying brand tell. Never body, never a CTA.
 */
function Eyebrow({
  children,
  color = 'var(--eyebrow)',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-eyebrow)',
      fontWeight: 'var(--fw-medium)',
      lineHeight: 'var(--lh-eyebrow)',
      letterSpacing: 'var(--ls-eyebrow)',
      textTransform: 'uppercase',
      color,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScanReady IconButton — square-ish icon-only control. Pill or md radius.
 * Pass an icon (img/svg) as children.
 */
function IconButton({
  children,
  variant = 'secondary',
  size = 'md',
  shape = 'rounded',
  disabled = false,
  label,
  style = {},
  ...rest
}) {
  const dims = {
    sm: 32,
    md: 40,
    lg: 44
  }[size];
  const variants = {
    primary: {
      background: 'var(--primary)',
      color: 'var(--on-primary)',
      borderColor: 'transparent'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--steel)',
      borderColor: 'var(--hairline)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--steel)',
      borderColor: 'transparent'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    disabled: disabled,
    style: {
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
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScanReady Tag — quiet paper pill for filters/categories; optional removable.
 * variant="skill" renders the accent-soft skill chip (green-on-soft).
 */
function Tag({
  children,
  onRemove,
  active = false,
  variant = 'default',
  style = {},
  ...rest
}) {
  const skin = variant === 'skill' ? {
    background: 'var(--accent-soft)',
    color: 'var(--accent-deep)',
    border: '1px solid transparent'
  } : {
    background: active ? 'var(--primary)' : 'var(--canvas)',
    color: active ? 'var(--on-primary)' : 'var(--steel)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--hairline)'}`
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      ...skin,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-medium)',
      borderRadius: 'var(--radius-full)',
      padding: '6px 14px',
      ...style
    }
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRemove,
    "aria-label": "Remove",
    style: {
      display: 'inline-flex',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      padding: 0,
      color: 'inherit',
      opacity: 0.7
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m6 6 12 12"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScanReady Input — warm canvas field, hairline border, 2px deep-green focus ring (the activation signal).
 * - multiline: renders a <textarea> (the Anschreiben / job-posting field)
 * - serif: switches the value to the reading-serif document voice (generated text)
 * - maxLength + showCounter: renders a right-aligned "128 / 2.000" counter (German thousands dot)
 */
function Input({
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
  const handleChange = e => {
    if (!isControlled) setInternal(e.target.value);
    onChange && onChange(e);
  };
  const fieldFont = serif ? 'var(--font-serif-text)' : 'var(--font-sans)';
  const fieldFs = serif ? 'var(--fs-doc)' : 'var(--fs-body-md)';
  const fieldLh = serif ? 'var(--lh-doc)' : 1.4;
  const fmt = n => n.toLocaleString('de-DE');
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
    padding: 0
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--brand-error)'
    }
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: multiline ? 'flex-start' : 'center',
      gap: '8px',
      minHeight: multiline ? undefined : '40px',
      padding: multiline ? '12px 14px' : '0 12px',
      background: 'var(--canvas)',
      borderRadius: 'var(--radius-sm)',
      border: error ? '2px solid var(--brand-error)' : focused ? '2px solid var(--accent)' : '1px solid var(--hairline)',
      transition: 'border-color var(--dur-fast) var(--ease-standard)'
    }
  }, iconLeft, multiline ? /*#__PURE__*/React.createElement("textarea", _extends({
    id: inputId,
    rows: rows,
    maxLength: maxLength,
    value: isControlled ? value : undefined,
    defaultValue: isControlled ? undefined : defaultValue,
    onChange: handleChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: innerStyle
  }, rest)) : /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    maxLength: maxLength,
    value: isControlled ? value : undefined,
    defaultValue: isControlled ? undefined : defaultValue,
    onChange: handleChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      ...innerStyle,
      height: '38px'
    }
  }, rest))), (hint || error || showCounter) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)',
      color: error ? 'var(--brand-error)' : 'var(--stone)'
    }
  }, error || hint), showCounter && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)',
      color: 'var(--body)',
      whiteSpace: 'nowrap',
      marginLeft: 'auto'
    }
  }, fmt(count), maxLength ? ` / ${fmt(maxLength)}` : '')));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SidebarNav.jsx
try { (() => {
/**
 * ScanReady SidebarNav — docs sidebar. Sections with mono-taupe headers; active item gets paper fill.
 * sections: [{ title, items: [{ id, label }] }]
 */
function SidebarNav({
  sections = [],
  value,
  onSelect,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      width: 'var(--sidebar-width)',
      ...style
    }
  }, sections.map((sec, si) => /*#__PURE__*/React.createElement("div", {
    key: si,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }
  }, sec.title && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px 4px'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Eyebrow, null, sec.title)), sec.items.map(it => {
    const on = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      onClick: () => onSelect && onSelect(it.id),
      style: {
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
        transition: 'background-color var(--dur-fast) var(--ease-standard)'
      }
    }, it.label);
  }))));
}
Object.assign(__ds_scope, { SidebarNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SidebarNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * ScanReady Tabs — two styles. underline (segmented, ink bottom-border) and pill (navy fill active).
 */
function Tabs({
  items = [],
  value,
  onChange,
  variant = 'underline',
  style = {}
}) {
  const [internal, setInternal] = React.useState(items[0]?.id);
  const active = value !== undefined ? value : internal;
  const select = id => {
    if (value === undefined) setInternal(id);
    onChange && onChange(id);
  };
  if (variant === 'pill') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-flex',
        gap: 'var(--space-xs)',
        flexWrap: 'wrap',
        ...style
      }
    }, items.map(it => {
      const on = it.id === active;
      return /*#__PURE__*/React.createElement("button", {
        key: it.id,
        type: "button",
        onClick: () => select(it.id),
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--fs-body-sm)',
          fontWeight: 'var(--fw-medium)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          background: on ? 'var(--primary)' : 'var(--canvas)',
          color: on ? 'var(--on-primary)' : 'var(--steel)',
          border: `1px solid ${on ? 'var(--primary)' : 'var(--hairline)'}`,
          transition: 'background-color var(--dur-fast) var(--ease-standard)'
        }
      }, it.label);
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-lg)',
      borderBottom: '1px solid var(--hairline)',
      ...style
    }
  }, items.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      onClick: () => select(it.id),
      style: {
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
        transition: 'color var(--dur-fast) var(--ease-standard)'
      }
    }, it.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScanReady Card — flat warm surface, 12px radius, hairline border.
 * variants: base (canvas + border), feature (paper, no border), document (reading-serif paper).
 */
function Card({
  children,
  variant = 'base',
  style = {},
  ...rest
}) {
  const variants = {
    base: {
      background: 'var(--canvas)',
      border: '1px solid var(--hairline)',
      padding: 'var(--space-xl)',
      color: 'var(--charcoal)'
    },
    feature: {
      background: 'var(--surface)',
      border: 'none',
      padding: 'var(--space-xxl)',
      color: 'var(--charcoal)'
    },
    document: {
      background: 'var(--canvas)',
      border: '1px solid var(--hairline)',
      padding: 'var(--space-xl)',
      color: 'var(--ink)',
      fontFamily: 'var(--font-serif-text)',
      fontSize: 'var(--fs-doc)',
      lineHeight: 'var(--lh-doc)'
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderRadius: 'var(--radius-lg)',
      ...variants[variant],
      ...style
    }
  }, rest), children);
}

/** Optional Inter heading-4 card title helper. */
function CardTitle({
  children,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-h4)',
      fontWeight: 'var(--fw-semibold)',
      lineHeight: 'var(--lh-h4)',
      color: 'var(--ink)',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card, CardTitle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/DocumentMockup.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScanReady DocumentMockup — the ONE shadowed element in the system. A framed preview of the
 * generated Lebenslauf / Anschreiben, rendered in the reading-serif document voice on warm card.
 * Use `title` for the serif document name and pass document body as children.
 */
function DocumentMockup({
  kicker,
  title,
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--canvas)',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-mockup)',
      padding: 'var(--space-xxl)',
      ...style
    }
  }, rest), kicker && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-eyebrow)',
      letterSpacing: 'var(--ls-eyebrow)',
      textTransform: 'uppercase',
      color: 'var(--eyebrow)',
      marginBottom: 'var(--space-sm)'
    }
  }, kicker), title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 'var(--fs-h4)',
      fontWeight: 'var(--fw-semibold)',
      lineHeight: 'var(--lh-h4)',
      color: 'var(--ink)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif-text)',
      fontSize: 'var(--fs-doc)',
      lineHeight: 'var(--lh-doc)',
      color: 'var(--ink)',
      marginTop: 'var(--space-xs)'
    }
  }, children));
}
Object.assign(__ds_scope, { DocumentMockup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/DocumentMockup.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/NormNote.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScanReady NormNote — the annotation chip that explains a normalization the system made
 * to the document (DIN date format, "Present" → "heute", etc). Accent-tint wash, hairline, 8px.
 */
function NormNote({
  label = 'Norm note',
  children,
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--accent-tint)',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-sm)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      lineHeight: 'var(--lh-body-sm)',
      color: 'var(--ink-soft)',
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 'var(--fw-semibold)'
    }
  }, label, ": "), children);
}
Object.assign(__ds_scope, { NormNote });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/NormNote.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/PricingCard.jsx
try { (() => {
/**
 * ScanReady PricingCard. Featured tier gets a 2px green border + faint green glow (the only glow).
 */
function PricingCard({
  name,
  price,
  period = '/mo',
  description,
  features = [],
  cta = 'Get started',
  featured = false,
  badge,
  style = {},
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-lg)',
      background: 'var(--canvas)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-xxl)',
      border: featured ? '2px solid var(--accent)' : '1px solid var(--hairline)',
      boxShadow: featured ? 'var(--shadow-brand-glow)' : 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Eyebrow, null, name), (badge || featured) && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "discount"
  }, badge || 'Popular')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '4px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontSize: 'var(--fs-display-lg)',
      fontWeight: 'var(--fw-semibold)',
      lineHeight: 1,
      letterSpacing: 'var(--ls-display-lg)',
      color: 'var(--ink)'
    }
  }, price), period && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      color: 'var(--steel)'
    }
  }, period)), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      lineHeight: 'var(--lh-body-sm)',
      color: 'var(--slate)'
    }
  }, description), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: featured ? 'accent' : 'secondary',
    onClick: onSelect,
    style: {
      width: '100%'
    }
  }, cta), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    }
  }, features.map((f, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body-sm)',
      lineHeight: 'var(--lh-body-sm)',
      color: 'var(--charcoal)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--accent-deep)",
    strokeWidth: "2.25",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      marginTop: '3px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  })), f))));
}
Object.assign(__ds_scope, { PricingCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/PricingCard.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/SignatureBand.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ScanReady SignatureBand — the navy color-block band. Carries a single trust/closing statement
 * (e.g. "Zero-retention, by design."). Serif headline, optional accent lock dot, centered by default.
 */
function SignatureBand({
  eyebrow,
  title,
  children,
  lock = true,
  align = 'center',
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: 'linear-gradient(135deg, var(--band-from) 0%, var(--band-to) 100%)',
      color: 'var(--on-dark)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-section-sm)',
      textAlign: align,
      ...style
    }
  }, rest), lock && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      width: 40,
      height: 40,
      borderRadius: 'var(--radius-full)',
      background: 'var(--accent)',
      margin: align === 'center' ? '0 auto var(--space-md)' : '0 0 var(--space-md)'
    }
  }), eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--fs-eyebrow)',
      letterSpacing: 'var(--ls-eyebrow)',
      textTransform: 'uppercase',
      color: 'var(--on-dark-soft)',
      marginBottom: 'var(--space-sm)'
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-serif)',
      fontSize: 'var(--fs-h2)',
      fontWeight: 'var(--fw-semibold)',
      lineHeight: 'var(--lh-h2)',
      color: 'var(--on-dark)'
    }
  }, title), children && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-subtitle)',
      lineHeight: 'var(--lh-subtitle)',
      color: 'var(--on-dark-soft)',
      maxWidth: '48ch',
      margin: align === 'center' ? 'var(--space-xs) auto 0' : 'var(--space-xs) 0 0'
    }
  }, children));
}
Object.assign(__ds_scope, { SignatureBand });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/SignatureBand.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SidebarNav = __ds_scope.SidebarNav;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardTitle = __ds_scope.CardTitle;

__ds_ns.DocumentMockup = __ds_scope.DocumentMockup;

__ds_ns.NormNote = __ds_scope.NormNote;

__ds_ns.PricingCard = __ds_scope.PricingCard;

__ds_ns.SignatureBand = __ds_scope.SignatureBand;

})();
