import type { Options } from "@oxlint/plugins"
import { RuleTester } from "oxlint/plugins-dev"
import { describe, expect, it } from "vitest"

import { noUnknownParametersRule } from "./no-unknown-parameters.ts"
import { ruleTester } from "./rule-tester.ts"

const unknown = (parameter: string) => ({ data: { parameter }, messageId: "unknownParameter" })

ruleTester.run("no-unknown-parameters", noUnknownParametersRule, {
  invalid: [
    { code: "function f(value: unknown) {}", errors: [unknown("value")] },
    { code: "const f = (value: unknown) => {}", errors: [unknown("value")] },
    { code: "const f = function (value: unknown) {}", errors: [unknown("value")] },
    { code: "function f(value: unknown | string) {}", errors: [unknown("value")] },
    { code: "function f(value?: unknown) {}", errors: [unknown("value")] },
    { code: "function f({ a }: unknown) {}", errors: [unknown("{ a }")] },
    { code: "class C { method(value: unknown) {} }", errors: [unknown("value")] },
    { code: "interface I { method(value: unknown): void }", errors: [unknown("value")] },
    { code: "interface I { (value: unknown): void }", errors: [unknown("value")] },
    { code: "interface I { new (value: unknown): I }", errors: [unknown("value")] },
    { code: "type F = (value: unknown) => void", errors: [unknown("value")] },
    { code: "type F = new (value: unknown) => object", errors: [unknown("value")] },
    { code: "declare function f(value: unknown): void", errors: [unknown("value")] },
    // Only the predicate's own subject is exempt.
    {
      code: "function isBox(value: unknown, other: unknown): value is Box { return true }",
      errors: [unknown("other")],
    },
    { code: "function f(a: unknown, b: unknown) {}", errors: [unknown("a"), unknown("b")] },
    // A custom list replaces the default, so `cause` is no longer exempt.
    {
      code: "function f(cause: unknown, raw: unknown) {}",
      errors: [unknown("cause")],
      options: [{ allowNames: ["raw"] }],
    },
  ],
  valid: [
    "function f(value: string) {}",
    "function f(value: Input) {}",
    "function f(value) {}",
    // The subject of a type predicate is where unknown gets parsed.
    "function isBox(value: unknown): value is Box { return true }",
    "const isBox = (value: unknown): value is Box => true",
    // An error cause is unknown by contract.
    "class E extends Error { constructor(message: string, cause: unknown) { super(message, { cause }) } }",
    "function fail(cause: unknown) {}",
    {
      code: "function f(raw: unknown, input: unknown) {}",
      options: [{ allowNames: ["raw", "input"] }],
    },
  ],
})

const runNow = (_name: string, run: () => void) => {
  run()
}

// Runs one case at once, so an options error throws here instead of inside a test.
function lintWithOptions(options: Options): void {
  RuleTester.describe = runNow
  RuleTester.it = runNow
  try {
    const valid = [{ code: "function f(value: string) {}", options }]
    ruleTester.run("no-unknown-parameters", noUnknownParametersRule, { invalid: [], valid })
  } finally {
    RuleTester.describe = describe
    RuleTester.it = it
  }
}

describe("no-unknown-parameters options", () => {
  it("accepts a list of names", () => {
    expect(() => lintWithOptions([{ allowNames: ["raw"] }])).not.toThrow()
  })

  it("rejects an empty name", () => {
    expect(() => lintWithOptions([{ allowNames: [""] }])).toThrow(/Options validation failed/u)
  })

  it("rejects a repeated name", () => {
    const options = [{ allowNames: ["raw", "raw"] }]

    expect(() => lintWithOptions(options)).toThrow(/Options validation failed/u)
  })
})
