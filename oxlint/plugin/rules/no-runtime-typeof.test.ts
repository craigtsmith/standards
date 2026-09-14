import { noRuntimeTypeofRule } from "./no-runtime-typeof.ts"
import { ruleTester } from "./rule-tester.ts"

const allowInTypeGuards = [{ allowInTypeGuards: true }]

ruleTester.run("no-runtime-typeof", noRuntimeTypeofRule, {
  invalid: [
    { code: "if (typeof value === 'string') use(value)", errors: [{ messageId: "runtimeTypeof" }] },
    { code: "const kind = typeof value", errors: [{ messageId: "runtimeTypeof" }] },
    // Default options do not allow a type guard either.
    {
      code: "function isString(value: unknown): value is string { return typeof value === 'string' }",
      errors: [{ messageId: "runtimeTypeof" }],
    },
    // A function without a type predicate is not a type guard.
    {
      code: "function isString(value: unknown): boolean { return typeof value === 'string' }",
      errors: [{ messageId: "runtimeTypeof" }],
      options: allowInTypeGuards,
    },
    // A nested plain function inside a type guard is not the guard.
    {
      code: "function isString(value: unknown): value is string { return [value].every((v) => typeof v === 'string') }",
      errors: [{ messageId: "runtimeTypeof" }],
      options: allowInTypeGuards,
    },
  ],
  valid: [
    "if (isString(value)) use(value)",
    // An existence probe is not a representation check.
    "if (typeof window !== 'undefined') use(window)",
    "if ('undefined' === typeof window) use(window)",
    "if (typeof window != 'undefined') use(window)",
    {
      code: "function isString(value: unknown): value is string { return typeof value === 'string' }",
      options: allowInTypeGuards,
    },
    {
      code: "const isString = (value: unknown): value is string => typeof value === 'string'",
      options: allowInTypeGuards,
    },
  ],
})
