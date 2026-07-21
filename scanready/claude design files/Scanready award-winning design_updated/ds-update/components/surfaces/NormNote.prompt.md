The annotation explaining one normalization the system made — calm, factual, one change per note.

```jsx
<NormNote>Date reformatted to DIN standard; “Present” → “heute”.</NormNote>   // inline chip
<NormNote n={2} kicker="Datum · DIN 5008">                                    // pinned margin card
  “Mar 2021 – Present” reformatted to “03/2021 – heute” — MM/JJJJ numerals, German “heute”.
</NormNote>
```

- Margin-rail cards stack in a 340px column beside the document sheet; each `n` matches an AnnotationPin on the sheet.
