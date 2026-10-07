# standards/no-unknown-parameters

Reports a function parameter whose type contains `unknown`. The function receives input nobody has parsed. Accept a named type and parse the input first, where it enters the program.

Enabled in the preset: `"error"`.

The rule checks functions, methods, call and construct signatures, function types and `declare function`. It reports `unknown` inside a union such as `unknown | string`, and optional parameters.

## Examples

### Incorrect

```ts
function save(value: unknown) {}
const update = (value: unknown | string) => {}

type Handler = (event: unknown) => void
```

### Correct

```ts
function save(value: Input) {}
```

## Exceptions

- A parameter named `cause`, which carries an error cause.
- The subject of a type predicate. Other `unknown` parameters of the same function are still reported.

```ts
class LoadError extends Error {
  constructor(message: string, cause: unknown) {
    super(message, { cause })
  }
}

function isBox(value: unknown): value is Box {
  return true
}
```
