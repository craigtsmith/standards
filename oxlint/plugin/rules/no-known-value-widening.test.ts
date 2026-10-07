import { noKnownValueWideningRule } from "./no-known-value-widening.ts"
import { ruleTester } from "./rule-tester.ts"

const widening = (subject: string, target: string) => ({
  data: { subject, target },
  messageId: "widening",
})

ruleTester.run("no-known-value-widening", noKnownValueWideningRule, {
  invalid: [
    { code: "const a: unknown = 1", errors: [widening("binding `a`", "unknown")] },
    { code: "const a: object = { width: 1 }", errors: [widening("binding `a`", "object")] },
    {
      code: "const a: { width: number } = { width: 1 }",
      errors: [widening("binding `a`", "anonymous object")],
    },
    {
      code: "const a: Record<string, number> = { width: 1 }",
      errors: [widening("binding `a`", "open dictionary")],
    },
    { code: "let a: unknown; a = 1", errors: [widening("binding `a`", "unknown")] },
    { code: "const a = 1 as unknown", errors: [widening("assertion", "unknown")] },
    { code: "const a = <unknown>1", errors: [widening("assertion", "unknown")] },
    {
      code: "function f(): unknown { return 1 }",
      errors: [widening("return value of `f`", "unknown")],
    },
    { code: "const f = (): unknown => 1", errors: [widening("return value of `f`", "unknown")] },
    {
      code: "class C { field: unknown = 1 }",
      errors: [widening("property `field`", "unknown")],
    },
    {
      code: "function isBox(value: unknown): value is Box { return true }; isBox({ width: 1 })",
      errors: [widening("argument for parameter `value` of `isBox`", "unknown")],
    },
    {
      code: "const isBox = (value: unknown): value is Box => true; isBox(1)",
      errors: [widening("argument for parameter `value` of `isBox`", "unknown")],
    },
    {
      code: "const a: Readonly<Record<string, number>> = { width: 1 }",
      errors: [widening("binding `a`", "open dictionary")],
    },
    {
      code: "const a: Record<PropertyKey, number> = { width: 1 }",
      errors: [widening("binding `a`", "open dictionary")],
    },
    {
      code: "type Key = string; const a: Record<Key, number> = { width: 1 }",
      errors: [widening("binding `a`", "open dictionary")],
    },
    {
      code: "type Bag<T> = Record<string, T>; const a: Bag<number> = { width: 1 }",
      errors: [widening("binding `a`", "generic container")],
    },
    // A generic alias in key position is followed with its arguments bound.
    {
      code: "type Key<T> = T; const a: Record<Key<string>, number> = { width: 1 }",
      errors: [widening("binding `a`", "open dictionary")],
    },
  ],
  valid: [
    "const a = 1",
    "const a = { width: 1 }",
    "const a: Box = { width: 1 }",
    "const a = { width: 1 } satisfies Box",
    // A value with no syntactic evidence may take a broad type.
    "const a: unknown = load()",
    "const a: unknown = value",
    "function f(): unknown { return load() }",
    "class C { field: unknown = load() }",
    // Only a call into a local type predicate is a widening; a plain function is a boundary.
    "function f(value: unknown) {}; f(1)",
    "function isBox(value: unknown): value is Box { return true }; isBox(load())",
    // Unknown as a boundary contract, not a widening of a known value.
    "function f(value: unknown): value is Box { return true }",
    'type Record<K, V> = { key: K; value: V }; const a: Record<string, number> = { key: "a", value: 1 }',
    'type PropertyKey = "width"; const a: Record<PropertyKey, number> = { width: 1 }',
    "interface Box { width: number }; const a: Box = { width: 1 }",
  ],
})
