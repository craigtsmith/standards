# standards/require-safety-comment-for-type-assertion

Reports a type assertion with no `SAFETY:` comment before it. An assertion overrides the type checker, so the reason it holds has to be written down.

Enabled in the preset: `"error"`, default options.

## Options

```json
{ "markers": ["SAFETY"] }
```

- `markers`: the words that open a justification. Case-sensitive. A comment matches when it contains a marker as a whole word, followed by a colon and some text.

## Examples

### Incorrect

```ts
const a = value as Box

// SAFETY
const b = value as Box

const c = value as Box // SAFETY: parsed above.
```

### Correct

```ts
// SAFETY: parsed by the schema above.
const box = value as Box

// SAFETY: parsed by the schema above.
render(value as Box)

class Store {
  // SAFETY: set in the constructor.
  field = value as Box
}
```

## Exceptions

`as const` assertions are not checked.

## Notes

The comment may sit directly before the assertion or before the statement or class property containing it. A comment before `export` covers an exported declaration. A comment after the assertion, or one belonging to an earlier statement, does not count.
