The signature green scan light that sweeps down a document sheet — use it on any sheet the system is reading, converting, or streaming.

```jsx
<div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
  {/* sheet content */}
  <ScanSweep variant="loop" duration="var(--dur-scan-parse)" intensity="strong" />
</div>
```

- `variant="cycle"` syncs to the 11s EN→DE convert cycle (pair with `sr-en-out` / `sr-de-in` layers).
- `intensity="strong"` + `duration="var(--dur-scan-parse)"` while parsing; soft + slow at rest.
- Host needs `position: relative`; the sweep is `aria-hidden` — pair with a text status for a11y.
