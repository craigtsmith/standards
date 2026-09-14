# standards/no-runtime-typeof

Reports the runtime `typeof` operator. A `typeof` check tests how a value is stored, scattered through the code. Parse the input first, then branch on the parsed value.

Enabled in the preset: `["error", { "allowInTypeGuards": true }]`.

## Options

```json
{ "allowInTypeGuards": false }
```

- `allowInTypeGuards`: allow `typeof` directly inside a function whose return type is a type predicate (`value is T`). A function nested inside the guard is still checked.

## Examples

### Incorrect

```ts
if (typeof value === "string") use(value)
const kind = typeof value

// Reported even with allowInTypeGuards: the return type is not a type predicate.
function isString(value: unknown): boolean {
  return typeof value === "string"
}
```

### Correct

```ts
if (isString(value)) use(value)

// With allowInTypeGuards, as in the preset.
function isString(value: unknown): value is string {
  return typeof value === "string"
}
```

## Exceptions

An existence probe is allowed: `typeof x` compared with `"undefined"` by `===`, `!==`, `==` or `!=`, on either side.

```ts
if (typeof window !== "undefined") use(window)
```

The type-level `typeof` in a type position, as in `type Config = typeof config`, is not reported.
