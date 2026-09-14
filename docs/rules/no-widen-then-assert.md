# standards/no-widen-then-assert

Reports a `const` given a broad type, then asserted back to a narrower one later in the same function. The value's type was known at the start. Keep the precise type from the declaration.

Enabled in the preset: `"error"`.

The broad types are `unknown`, `any`, `object` and open dictionaries such as `Record<string, unknown>`. The widening can be an annotation or an assertion on the initialiser.

## Examples

### Incorrect

```ts
const size: unknown = { width: 1 }
use(size as Box)

const area = { width: 1 } as unknown
use(area as Box)

const sizes: Record<string, unknown> = { width: 1 }
use(sizes as Record<string, number>)
```

### Correct

```ts
const size: Box = { width: 1 }
use(size)
```

## Exceptions

- The initialiser has nothing known about it, such as a call result: `const data: unknown = load()`.
- The binding is declared with `let`.
- The assertion is in a different function from the declaration.
- The assertion is to another broad type, such as `size as object`.
