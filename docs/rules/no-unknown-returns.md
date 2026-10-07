# standards/no-unknown-returns

Reports a function whose declared return type is `unknown`, `Promise<unknown>` or `PromiseLike<unknown>`. Every caller then has to work out what it received. Parse the value inside the function and return a named type.

Enabled in the preset: `"error"`.

The rule follows type aliases and reports `unknown` inside a union. It checks functions, methods, call and construct signatures, function types and `declare function`.

## Examples

### Incorrect

```ts
declare function load(): unknown
declare function fetchBox(): Promise<unknown>

type Loaded = unknown
declare function read(): Loaded
```

### Correct

```ts
declare function load(): Box
declare function fetchBox(): Promise<Box>
function identity<T>(value: T): T {
  return value
}
```

## Notes

A function with no return type annotation is not checked. A type parameter is not treated as `unknown`.
