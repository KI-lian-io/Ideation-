Full-pill button — use for every actionable control; navy `primary` is the default CTA, mint `accent` is the single brand-emphasis CTA per viewport.

```jsx
<Button variant="primary">Get started</Button>
<Button variant="accent" iconRight={<img src="assets/icons/arrow-right.svg" width="16" />}>Read the docs</Button>
<Button variant="secondary">Talk to sales</Button>
<Button variant="onDark">Get started</Button>   {/* on dark hero bands */}
<Button variant="ghost">Cancel</Button>          {/* rectangular tertiary */}
```

Variants: `primary` (navy), `accent` (mint), `onDark` (white), `secondary` (outline), `ghost` (rect). Sizes `sm | md | lg`. No-hover policy — default + pressed only. Never soften the pill corners.
