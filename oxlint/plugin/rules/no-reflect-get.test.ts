import { noReflectGetRule } from "./no-reflect-get.ts"
import { ruleTester } from "./rule-tester.ts"

ruleTester.run("no-reflect-get", noReflectGetRule, {
  invalid: [
    { code: "Reflect.get(target, 'key')", errors: [{ messageId: "reflectGet" }] },
    { code: "Reflect['get'](target, 'key')", errors: [{ messageId: "reflectGet" }] },
  ],
  valid: [
    "target.key",
    "target['key']",
    "Reflect.has(target, 'key')",
    "const Reflect = { get: (o: object) => o }; Reflect.get(target)",
  ],
})
