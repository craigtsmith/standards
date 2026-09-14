# standards/no-known-value-widening

Reports a value whose type is clear from the source, such as a literal or an object literal, being given a broader annotated type. The broad type throws away what TypeScript already knows. Leave the type inferred, check it with `satisfies`, or annotate with a named type.

Enabled in the preset: `"error"`.

The broad types are `unknown`, `object`, an anonymous object type such as `{ width: number }`, and an open dictionary such as `Record<string, number>`. The rule checks variable declarations, assignments, class properties, return types, `as` and `<T>` assertions, and arguments to a local type predicate.

## Examples

### Incorrect

```ts
const width: unknown = 1
const size: { width: number } = { width: 1 }
const sizes: Record<string, number> = { width: 1 }
const value = 1 as unknown

function defaultWidth(): unknown {
  return 1
}

function isBox(value: unknown): value is Box {
  return true
}
isBox({ width: 1 })
```

### Correct

```ts
const width = 1
const size: Box = { width: 1 }
const sizes = { width: 1 } satisfies Box
```

## Exceptions

- A value with nothing known about it in the source, such as a call result or another variable: `const data: unknown = load()`.
- An argument to a plain function. Only calls into a type predicate declared in the same file are checked.
- A type predicate's own `unknown` parameter.
