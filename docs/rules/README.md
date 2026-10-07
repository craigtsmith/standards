# standards rules

These rules come from the `standards` JS plugin, which `@craigts.dev/standards/oxlint` loads. The preset enables all of them.

| Rule                                                                                        | Reports                                                             | Default                          | Options |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------- | ------- |
| [`max-comment-lines`](max-comment-lines.md)                                                 | A comment, doc block or file header over its line limit             | error                            | yes     |
| [`no-chained-type-assertions`](no-chained-type-assertions.md)                               | `value as unknown as T` and other assertion chains                  | error                            | no      |
| [`no-conditional-empty-object-spread`](no-conditional-empty-object-spread.md)               | `...(flag ? { a } : {})` in an object literal                       | error                            | no      |
| [`no-known-value-widening`](no-known-value-widening.md)                                     | A known value given a broad annotated type                          | error                            | no      |
| [`no-module-mocking`](no-module-mocking.md)                                                 | `vi.mock`, `jest.mock` and related module mocks                     | error                            | no      |
| [`no-object-parameters`](no-object-parameters.md)                                           | A parameter typed `object`                                          | error                            | no      |
| [`no-reflect-apply`](no-reflect-apply.md)                                                   | `Reflect.apply`                                                     | error                            | no      |
| [`no-reflect-get`](no-reflect-get.md)                                                       | `Reflect.get`                                                       | error                            | no      |
| [`no-runtime-typeof`](no-runtime-typeof.md)                                                 | The runtime `typeof` operator                                       | error, `allowInTypeGuards: true` | yes     |
| [`no-unknown-parameters`](no-unknown-parameters.md)                                         | A parameter typed `unknown`                                         | error                            | yes     |
| [`no-unknown-returns`](no-unknown-returns.md)                                               | A return type of `unknown` or `Promise<unknown>`                    | error                            | no      |
| [`no-unknown-type-aliases`](no-unknown-type-aliases.md)                                     | A type alias that resolves to `unknown`                             | error                            | no      |
| [`no-unsafe-dictionary-type`](no-unsafe-dictionary-type.md)                                 | A dictionary whose value type is `unknown`, `any`, `object` or `{}` | error                            | no      |
| [`no-widen-then-assert`](no-widen-then-assert.md)                                           | A `const` widened, then asserted back to a narrower type            | error                            | no      |
| [`require-safety-comment-for-type-assertion`](require-safety-comment-for-type-assertion.md) | A type assertion with no `SAFETY:` comment                          | error                            | yes     |

To turn a rule off, or change its options, set it in the consumer's `oxlint.config.ts`:

```ts
import { defineConfig } from "@craigts.dev/standards/oxlint"

export default defineConfig({
  rules: {
    "standards/no-module-mocking": "off",
    "standards/max-comment-lines": ["error", { max: 5 }],
  },
})
```
