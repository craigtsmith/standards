# standards/no-unsafe-dictionary-type

Reports a dictionary type whose value type is `unknown`, `any`, `object` or `{}`, or a union containing one of them. Every read from it then needs a check or an assertion. Give the dictionary the precise value type, and parse external data before it goes in.

Enabled in the preset: `"error"`.

The rule checks `Record<K, V>`, index signatures in type literals and interfaces, and mapped types. It follows type aliases for the value type.

## Examples

### Incorrect

```ts
type Bag = Record<string, unknown>
type Lookup = { [key: string]: any }
type Index = { [K in string]: object }
interface Store {
  [key: string]: unknown
}
const bag: Record<string, User | unknown> = {}
```

### Correct

```ts
type Users = Record<string, User>
interface UserIndex {
  [id: string]: User
}
type Flags = Record<string, boolean>
```

## Exceptions

- A type parameter constraint: `function f<T extends Record<string, unknown>>(value: T) {}`.
- A value type with structure, such as `Record<string, [string, unknown]>`.

A nested unsafe dictionary reports once, at the outermost one. A use of an alias that is already reported does not report again.
