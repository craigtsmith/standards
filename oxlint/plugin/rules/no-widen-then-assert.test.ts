import { noWidenThenAssertRule } from "./no-widen-then-assert.ts"
import { ruleTester } from "./rule-tester.ts"

const widened = (name: string) => ({ data: { name }, messageId: "widenThenAssert" })

ruleTester.run("no-widen-then-assert", noWidenThenAssertRule, {
  invalid: [
    { code: "const a: unknown = { width: 1 }; use(a as Box)", errors: [widened("a")] },
    { code: "const a: unknown = { width: 1 }; use(<Box>a)", errors: [widened("a")] },
    { code: "const a: any = { width: 1 }; use(a as Box)", errors: [widened("a")] },
    { code: "const a: unknown = 1; use(a as number)", errors: [widened("a")] },
    { code: "const a = { width: 1 } as unknown; use(a as Box)", errors: [widened("a")] },
    { code: "const a: object = { width: 1 }; use(a as { width: number })", errors: [widened("a")] },
    { code: "const a: object = [1]; use(a as number[])", errors: [widened("a")] },
    {
      code: "const a: Record<string, unknown> = { width: 1 }; use(a as Record<string, number>)",
      errors: [widened("a")],
    },
    {
      code: "const a: unknown = { width: 1 }; use(a as Box); use(a as Box)",
      errors: [widened("a"), widened("a")],
    },
  ],
  valid: [
    "const a = { width: 1 }; use(a)",
    "const a: Box = { width: 1 }; use(a as Box)",
    // No known value: the binding came from outside.
    "const a: unknown = load(); use(a as Box)",
    "const a: unknown = value; use(a as Box)",
    // A widened binding asserted to another broad type recovers nothing.
    "const a: unknown = { width: 1 }; use(a as object)",
    // A reassignable binding is not a stable flow.
    "let a: unknown = { width: 1 }; use(a as Box)",
    // Different function boundaries.
    "const a: unknown = { width: 1 }; function f() { return a as Box }",
    // The assertion precedes the declaration in source order.
    "function f() { return a as Box }; const a: unknown = { width: 1 }",
  ],
})
