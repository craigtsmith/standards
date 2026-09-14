import { noUnknownTypeAliasesRule } from "./no-unknown-type-aliases.ts"
import { ruleTester } from "./rule-tester.ts"

const hides = (alias: string) => ({ data: { alias }, messageId: "unknownAlias" })

ruleTester.run("no-unknown-type-aliases", noUnknownTypeAliasesRule, {
  invalid: [
    { code: "type Loaded = unknown", errors: [hides("Loaded")] },
    { code: "type Loaded = unknown | string", errors: [hides("Loaded")] },
    { code: "type Loaded = (unknown)", errors: [hides("Loaded")] },
    // Resolution follows alias chains and generic instantiation.
    { code: "type Raw = unknown; type Loaded = Raw", errors: [hides("Raw"), hides("Loaded")] },
    { code: "type Id<T> = T; type Loaded = Id<unknown>", errors: [hides("Loaded")] },
    { code: "type Id<T> = T; type Loaded = Id<string | unknown>", errors: [hides("Loaded")] },
    { code: "type Id<T = unknown> = T; type Loaded = Id", errors: [hides("Loaded")] },
    // A local alias named like a built-in is followed.
    { code: "type Readonly<T> = T; type Loaded = Readonly<unknown>", errors: [hides("Loaded")] },
    // Cycle detection is per declaration, so a shadowed name is still followed.
    {
      code: "type Value = unknown; type Outer = Value; function f() { type Value = Outer }",
      errors: [hides("Value"), hides("Outer"), hides("Value")],
    },
  ],
  valid: [
    "type Id = string",
    "type Loaded = Box | null",
    // Unknown nested inside a structure is not the alias's own type.
    "type Payload = { value: unknown }",
    "type Loader = () => unknown",
    "type Values = unknown[]",
    "type Dictionary = Record<string, unknown>",
    "type Loaded<T> = T",
    // A built-in utility type is not an alias for its argument.
    "type Loaded = Readonly<unknown>",
    "interface Raw {}; type Loaded = Raw",
    "type A = B; type B = A",
    // An explicit argument is read where the reference stands.
    "type Second<A, B> = B; type Flip<A> = Second<unknown, A>; type Loaded = Flip<string>",
    // A type parameter given type arguments is not substituted.
    "type Apply<T> = T<string>; type Loaded = Apply<unknown>",
    // An alias body sees only its own parameters, so `Outer`'s `T` does not reach `Inner`.
    "type T = string; type Inner = T; type Outer<T> = Inner; type Loaded = Outer<unknown>",
  ],
})
