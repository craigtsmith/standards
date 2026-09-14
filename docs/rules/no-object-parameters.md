# standards/no-object-parameters

Reports a function parameter typed as `object`. It accepts any non-primitive and says nothing about the shape. Use a named type, and parse the input first.

Enabled in the preset: `"error"`.

The rule checks functions, methods, call and construct signatures, function types and `declare function`. It follows type aliases, and reports `object` inside a union such as `object | null`.

## Examples

### Incorrect

```ts
function save(value: object) {}

type Owner = object
function update(value: Owner) {}
```

### Correct

```ts
function save(value: Box) {}
function resize(value: { width: number }) {}
function update(value: Record<string, number>) {}
```

## Notes

Array types such as `object[]` are not reported.
