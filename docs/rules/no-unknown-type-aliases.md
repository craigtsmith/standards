# standards/no-unknown-type-aliases

Reports a type alias that resolves to `unknown`. The alias hides `unknown` behind a name. Write `unknown` where it is used, or alias the parsed type.

Enabled in the preset: `"error"`.

The rule follows alias chains and generic aliases, and reports `unknown` inside a union.

## Examples

### Incorrect

```ts
type Loaded = unknown
type Input = unknown | string

type Raw = unknown
type Parsed = Raw

type Id<T> = T
type Wrapped = Id<unknown>
```

### Correct

```ts
type Loaded = Box | null
type Payload = { value: unknown }
type Loader = () => unknown
type Values = unknown[]
```

## Notes

Only the alias's own type is checked. `unknown` nested in an object, function, array or other structure is not reported by this rule.
