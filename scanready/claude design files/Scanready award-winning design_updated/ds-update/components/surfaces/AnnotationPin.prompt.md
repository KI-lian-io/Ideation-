Numbered green circle placed on the document (next to a date, the photo slot, a section label) linking to the matching pinned NormNote in the margin rail.

```jsx
<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
  <span>03/2021 – heute</span>
  <AnnotationPin n={2} />
</span>
```

- Numbers count top-to-bottom on the sheet and match `<NormNote n={2} …>` in the rail.
