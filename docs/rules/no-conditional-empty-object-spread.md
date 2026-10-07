# standards/no-conditional-empty-object-spread

Reports an object spread of a conditional with `{}` on one side, such as `...(flag ? { extra } : {})`. The pattern hides an optional property inside an expression. Build the object first and add the property in a separate statement.

Enabled in the preset: `"error"`.

## Examples

### Incorrect

```ts
const options = { ...base, ...(timeout ? { timeout } : {}) }
```

### Correct

```ts
const options: Options = { ...base }
if (timeout) options.timeout = timeout
```

## Notes

Only spreads into an object literal are checked. Array spreads and argument spreads such as `fn(...(flag ? [1] : []))` are not reported. A conditional between two non-empty objects is not reported. The empty side is still `{}` when wrapped in parentheses, `as`, `satisfies`, `<T>` or `!`, so `...(flag ? ({} as Extra) : { extra })` is reported.
