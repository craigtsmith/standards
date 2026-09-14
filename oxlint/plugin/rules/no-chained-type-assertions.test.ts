import { noChainedTypeAssertionsRule } from "./no-chained-type-assertions.ts"
import { ruleTester } from "./rule-tester.ts"

ruleTester.run("no-chained-type-assertions", noChainedTypeAssertionsRule, {
  invalid: [
    { code: "const a = value as unknown as Box", errors: [{ messageId: "chained" }] },
    { code: "const a = (value as unknown) as Box", errors: [{ messageId: "chained" }] },
    { code: "const a = <Box>(<unknown>value)", errors: [{ messageId: "chained" }] },
    { code: "const a = <Box>(value as unknown)", errors: [{ messageId: "chained" }] },
    // A const assertion in the chain does not excuse the other one.
    { code: "const a = (value as const) as Box", errors: [{ messageId: "chained" }] },
    // Only the outermost assertion reports, once per chain.
    { code: "const a = value as unknown as object as Box", errors: [{ messageId: "chained" }] },
  ],
  valid: [
    "const a = value as Box",
    "const a = <Box>value",
    "const a = value as const",
    // Two const assertions carry no widening.
    "const a = (value as const) as const",
    "const a = (value as Box).inner as Inner",
  ],
})
