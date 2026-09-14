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
    // An assertion on the empty branch does not change the construct.
    {
      code: "const a = { ...(flag ? ({} as Extra) : { extra }) }",
      errors: [{ messageId: "avoid" }],
    },
    { code: "const a = { ...(flag ? {} as Extra : { extra }) }", errors: [{ messageId: "avoid" }] },
    {
      code: "const a = { ...(flag ? { extra } : ({}) satisfies Extra) }",
      errors: [{ messageId: "avoid" }],
    },
    { code: "const a = { ...(flag ? { extra } : <Extra>{}) }", errors: [{ messageId: "avoid" }] },
    { code: "const a = { ...(flag ? { extra } : {}!) }", errors: [{ messageId: "avoid" }] },
    {
      code: "const a = { ...(flag ? { extra } : (({} as Extra) satisfies Extra)) }",
      errors: [{ messageId: "avoid" }],
    },
  ],
  valid: [
    "const a = { ...base }",
    "const a = { ...(flag ? withExtra : withoutExtra) }",
    "const a = { extra: flag ? extra : undefined }",
    // An array spread is a different construct.
    "const a = [...(flag ? [1] : [])]",
    "fn(...(flag ? [1] : []))",
    // An assertion on a non-empty branch does not make it empty.
    "const a = { ...(flag ? ({ extra } as Extra) : withoutExtra) }",
  ],
})
