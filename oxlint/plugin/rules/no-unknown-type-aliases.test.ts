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
  ],
})
