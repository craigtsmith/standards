import { noReflectApplyRule } from "./no-reflect-apply.ts"
import { ruleTester } from "./rule-tester.ts"

ruleTester.run("no-reflect-apply", noReflectApplyRule, {
  invalid: [
    { code: "Reflect.apply(fn, null, [1])", errors: [{ messageId: "reflectApply" }] },
    { code: "Reflect['apply'](fn, null, [])", errors: [{ messageId: "reflectApply" }] },
  ],
  valid: [
    "fn(1, 2)",
    "fn.apply(null, [1, 2])",
    "Reflect.get(target, 'key')",
    "const Reflect = { apply: (f: () => void) => f() }; Reflect.apply(fn)",
  ],
})
