Tab navigation in two styles.

```jsx
<Tabs items={[{id:'a',label:'Overview'},{id:'b',label:'API'}]} variant="underline" />
<Tabs items={[{id:'all',label:'All'},{id:'new',label:'New'}]} variant="pill" />
```

`underline` = segmented with 2px ink bottom-border on active; `pill` = navy fill on active. Controlled via `value`/`onChange` or uncontrolled.
