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
    // Built-in utility types are followed when nothing local shadows them.
    { code: "type Bag = Readonly<Record<string, unknown>>", errors: [unsafe("unknown")] },
    { code: "type Bag = Partial<Record<string, any>>", errors: [unsafe("any")] },
    { code: 'type Bag = Pick<Record<string, unknown>, "a">', errors: [unsafe("unknown")] },
    {
      code: "interface Empty {}; type Bag = Record<string, Empty>",
      errors: [unsafe("empty-object")],
    },
    // A default type argument is read inside the alias.
    {
      code: "type Bag<V = unknown> = Record<string, V>; type Users = Bag",
      errors: [unsafe("unknown")],
    },
    { code: "type Id<T> = T; type Bag = Record<string, Id<unknown>>", errors: [unsafe("unknown")] },
    // An interface is found in the scope that declares it.
    {
      code: "function f() { interface Empty {}; type Bag = Record<string, Empty> }",
      errors: [unsafe("empty-object")],
    },
    // Cycle detection is per declaration, so a shadowed name is still followed.
    {
      code: "type Value = unknown; type Outer = Value; function f() { type Value = Outer; type Bag = Record<string, Value> }",
      errors: [unsafe("unknown")],
    },
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
    // A local declaration shadows the built-in of the same name.
    "type Record<K, V> = { key: K; value: V }; type Bag = Record<string, unknown>",
    "type Tree = Record<string, Tree>",
    "type A = Record<string, B>; type B = A",
    // A type parameter shadows an interface of the same name.
    "interface Empty {}; type Bag<Empty> = Record<string, Empty>",
    // An explicit argument is read where the reference stands, so `A` is unbound here.
    "type Pair<A, B> = Record<string, B>; type Flip<A> = Pair<unknown, A>",
    // A type parameter cannot take type arguments, so `T<number>` is not `T`.
    "type Values<T> = Record<string, T<number>>; type Bag = Values<unknown>",
    // A mapped type's key shadows the alias parameter of the same name.
    "type Keyed<K> = { [K in Id]: K }; type Bag = Keyed<unknown>",
  ],
})
