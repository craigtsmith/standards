import { noUnknownReturnsRule } from "./no-unknown-returns.ts"
import { ruleTester } from "./rule-tester.ts"

const error = [{ messageId: "unknownReturn" }]

ruleTester.run("no-unknown-returns", noUnknownReturnsRule, {
  invalid: [
    { code: "function f(): unknown { return value }", errors: error },
    { code: "const f = (): unknown => value", errors: error },
    { code: "const f = function (): unknown { return value }", errors: error },
    { code: "function f(): unknown | string { return value }", errors: error },
    { code: "function f(): (unknown) { return value }", errors: error },
    { code: "async function f(): Promise<unknown> { return value }", errors: error },
    { code: "function f(): PromiseLike<unknown> { return value }", errors: error },
    { code: "class C { method(): unknown { return value } }", errors: error },
    { code: "interface I { method(): unknown }", errors: error },
    { code: "interface I { (): unknown }", errors: error },
    { code: "type F = () => unknown", errors: error },
    { code: "declare function f(): unknown", errors: error },
    // An alias does not hide the unknown.
    { code: "type Loaded = unknown; function f(): Loaded { return value }", errors: error },
    {
      code: "type Loaded = unknown; function f(): Promise<Loaded> { return value }",
      errors: error,
    },
    { code: "type Loaded<T> = T; function f(): Loaded<unknown> { return value }", errors: error },
  ],
  valid: [
    "function f(): string { return '' }",
    "function f(): Box { return box }",
    "function f() { return value }",
    "function f(): Promise<Box> { return load() }",
    "type Loaded = Box; function f(): Loaded { return box }",
    // A generic parameter is not unknown, whatever it is instantiated with.
    "function f<T>(value: T): T { return value }",
  ],
})
