The converter's flow indicator — mono uppercase steps with status dots and hairline connectors, centered in the app bar.

```jsx
<Stepper current={1} />                         // 1 done, 2 current, 3 upcoming
<Stepper compact current={2} />                 // numbers-only, for 390px app bars
```

- Done = filled accent dot, current = ink-outlined, upcoming = stone-outlined.
- Keep the default three labels for the converter; don't exceed four steps.
