# standards/no-reflect-get

Reports `Reflect.get`. It reads a property TypeScript does not check. Use property access on a typed value, and parse dynamic input first.

Enabled in the preset: `"error"`.

## Examples

### Incorrect

```ts
const name = Reflect.get(user, "name")
```

### Correct

```ts
const name = user.name
const email = user["email"]
```

## Notes

Only the global `Reflect` is checked. A local variable named `Reflect` is not reported. Other `Reflect` methods such as `Reflect.has` are not reported.
