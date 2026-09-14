import { noObjectParametersRule } from "./no-object-parameters.ts"
import { ruleTester } from "./rule-tester.ts"

const broad = (parameter: string) => ({ data: { parameter }, messageId: "objectParameter" })

ruleTester.run("no-object-parameters", noObjectParametersRule, {
  invalid: [
    { code: "function f(value: object) {}", errors: [broad("value")] },
    { code: "const f = (value: object) => {}", errors: [broad("value")] },
    { code: "function f(value: object | null) {}", errors: [broad("value")] },
    { code: "function f(value: (object)) {}", errors: [broad("value")] },
    { code: "function f({ a }: object) {}", errors: [broad("{ a }")] },
    { code: "class C { method(value: object) {} }", errors: [broad("value")] },
    { code: "interface I { method(value: object): void }", errors: [broad("value")] },
    { code: "interface I { (value: object): void }", errors: [broad("value")] },
    { code: "interface I { new (value: object): I }", errors: [broad("value")] },
    { code: "type F = (value: object) => void", errors: [broad("value")] },
    { code: "type F = new (value: object) => object", errors: [broad("value")] },
    { code: "declare function f(value: object): void", errors: [broad("value")] },
    // An alias does not hide the broad type.
    { code: "type Owner = object; function f(value: Owner) {}", errors: [broad("value")] },
    { code: "type Id<T> = T; function f(value: Id<object>) {}", errors: [broad("value")] },
    { code: "function f(a: object, b: object) {}", errors: [broad("a"), broad("b")] },
  ],
  valid: [
    "function f(value: Box) {}",
    "function f(value: { width: number }) {}",
    "function f(value: Record<string, number>) {}",
    "function f(value: object[]) {}",
    "function f(value: Box | null) {}",
    "type Owner = Box; function f(value: Owner) {}",
  ],
})
