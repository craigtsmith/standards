import { noUnsafeDictionaryTypeRule } from "./no-unsafe-dictionary-type.ts"
import { ruleTester } from "./rule-tester.ts"

const unsafe = (value: string) => ({ data: { value }, messageId: "unsafeDictionary" })

ruleTester.run("no-unsafe-dictionary-type", noUnsafeDictionaryTypeRule, {
  invalid: [
    { code: "type Bag = Record<string, unknown>", errors: [unsafe("unknown")] },
    // A consumer of a flagged alias is reported at the alias, not at each use.
    {
      code: "type Bag = Record<string, unknown>; function f(bag: Bag) {}",
      errors: [unsafe("unknown")],
    },
    { code: "type Bag = Record<string, any>", errors: [unsafe("any")] },
    { code: "type Bag = Record<string, object>", errors: [unsafe("object")] },
    { code: "type Bag = Record<string, {}>", errors: [unsafe("empty-object")] },
    { code: "type Bag = Record<string, User | unknown>", errors: [unsafe("union")] },
    { code: "type Bag = { [key: string]: unknown }", errors: [unsafe("unknown")] },
    { code: "type Bag = { [K in string]: unknown }", errors: [unsafe("unknown")] },
    { code: "interface Bag { [key: string]: unknown }", errors: [unsafe("unknown")] },
    { code: "function f(bag: Record<string, unknown>) {}", errors: [unsafe("unknown")] },
    { code: "const bag: Record<string, unknown> = {}", errors: [unsafe("unknown")] },
    // An alias for the value type does not hide it.
    { code: "type Raw = unknown; type Bag = Record<string, Raw>", errors: [unsafe("unknown")] },
    // The outermost unsafe dictionary reports once.
    { code: "type Bag = Record<string, Record<string, unknown>>", errors: [unsafe("unknown")] },
  ],
  valid: [
    "type Users = Record<string, User>",
    "type Users = { [id: string]: User }",
    "type Users = { [K in Id]: User }",
    "interface Users { [id: string]: User }",
    "type Flags = Record<string, boolean>",
    "type Nested = Record<string, Record<string, number>>",
    "type Tuple = Record<string, [string, unknown]>",
    // A type parameter constraint is where an unsafe dictionary is legitimately named.
    "function f<T extends Record<string, unknown>>(value: T) {}",
  ],
})
