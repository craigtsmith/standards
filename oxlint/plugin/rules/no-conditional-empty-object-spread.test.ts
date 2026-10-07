import { noConditionalEmptyObjectSpreadRule } from "./no-conditional-empty-object-spread.ts"
import { ruleTester } from "./rule-tester.ts"

ruleTester.run("no-conditional-empty-object-spread", noConditionalEmptyObjectSpreadRule, {
  invalid: [
    { code: "const a = { ...(flag ? { extra } : {}) }", errors: [{ messageId: "avoid" }] },
    { code: "const a = { ...(flag ? {} : { extra }) }", errors: [{ messageId: "avoid" }] },
    { code: "const a = { ...(flag && extra ? { extra } : {}) }", errors: [{ messageId: "avoid" }] },
    { code: "const a = { ...((flag ? { extra } : {})) }", errors: [{ messageId: "avoid" }] },
    { code: "const a = { ...(flag ? { extra } : ({})) }", errors: [{ messageId: "avoid" }] },
    {
      code: "const a = { ...(a ? { a } : {}), ...(b ? { b } : {}) }",
      errors: [{ messageId: "avoid" }, { messageId: "avoid" }],
    },
  ],
  valid: [
    "const a = { ...base }",
    "const a = { ...(flag ? withExtra : withoutExtra) }",
    "const a = { extra: flag ? extra : undefined }",
    // An array spread is a different construct.
    "const a = [...(flag ? [1] : [])]",
    "fn(...(flag ? [1] : []))",
    // Only a literal `{}` counts as empty; an asserted one is left alone.
    "const a = { ...(flag ? { extra } : ({} as Extra)) }",
  ],
})
