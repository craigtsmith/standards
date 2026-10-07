# standards/no-reflect-apply

Reports `Reflect.apply`. It calls a function with arguments TypeScript does not check. Call the function directly.

Enabled in the preset: `"error"`.

## Examples

### Incorrect

```ts
Reflect.apply(sum, null, [1, 2])
Reflect["apply"](sum, null, [1, 2])
```

### Correct

```ts
sum(1, 2)
```

## Notes

Only the global `Reflect` is checked. A local variable named `Reflect` is not reported. `Function.prototype.apply`, as in `sum.apply(null, [1, 2])`, is not reported.
