The norm-conversion marquee band — mono uppercase before→after pairs scrolling under the hero. Use at most one per page.

```jsx
<NormTicker items={[{ from: 'Mar 2021 – Present', to: '03/2021 – heute' }, 'DIN 5008', { from: 'Fluent', to: 'Verhandlungssicher' }]} />
```

- String items render as plain facts; `{from, to}` pairs get the green arrow.
- Defaults ship the six canonical German-norm conversions — omit `items` for the standard band.
