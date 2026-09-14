# standards/no-chained-type-assertions

Reports a chain of type assertions such as `value as unknown as Box`. The intermediate assertion switches off TypeScript's check that the two types overlap. Keep the precise type, or parse the input first.

Enabled in the preset: `"error"`.

## Examples

### Incorrect

```ts
const a = value as unknown as Box
const b = <Box>(<unknown>value)
const c = value as const as Box
```

### Correct

```ts
const a = value as Box
const b = parseBox(value)
const inner = (value as Box).inner as Inner
```

## Exceptions

- A chain made only of `as const` assertions.
- An assertion on a property of an asserted value, as in `(value as Box).inner as Inner`.

A chain reports once, at the outermost assertion. Parentheses do not break a chain.
