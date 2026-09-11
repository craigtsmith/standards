import { requireSafetyCommentForTypeAssertionRule } from "./require-safety-comment-for-type-assertion.ts"
import { ruleTester } from "./rule-tester.ts"

const missing = (marker = "SAFETY") => ({ data: { marker }, messageId: "missingSafetyComment" })

ruleTester.run(
  "require-safety-comment-for-type-assertion",
  requireSafetyCommentForTypeAssertionRule,
  {
    invalid: [
      { code: "const a = value as Box", errors: [missing()] },
      { code: "const a = <Box>value", errors: [missing()] },
      { code: "// SAFETY without a colon\nconst a = value as Box", errors: [missing()] },
      { code: "// SAFETY:\nconst a = value as Box", errors: [missing()] },
      {
        code: "// UNSAFETY: the marker must stand alone.\nconst a = value as Box",
        errors: [missing()],
      },
      // A comment after the assertion does not count.
      { code: "const a = value as Box // SAFETY: too late.", errors: [missing()] },
      // A comment two statements up belongs to that statement.
      { code: "// SAFETY: for b only.\nconst b = 1\nconst a = value as Box", errors: [missing()] },
      {
        code: "const a = value as Box",
        errors: [missing("TRUST")],
        options: [{ markers: ["TRUST"] }],
      },
      {
        code: "// SAFETY: checked.\nconst a = value as Box",
        errors: [missing("TRUST")],
        options: [{ markers: ["TRUST"] }],
      },
    ],
    valid: [
      "const a = value as const",
      "// SAFETY: parsed by the schema above.\nconst a = value as Box",
      "/* SAFETY: parsed by the schema above. */\nconst a = value as Box",
      "// SAFETY: parsed by the schema above.\nconst a = <Box>value",
      // The comment may sit on the containing statement.
      "// SAFETY: parsed by the schema above.\nreturn fn(value as Box)",
      "// SAFETY: parsed by the schema above.\nexport const a = value as Box",
      "class C {\n  // SAFETY: set in the constructor.\n  field = value as Box\n}",
      // The marker must be followed by a colon and some text.
      "// safety: lower case is not the marker, but SAFETY: is.\nconst a = value as Box",
      {
        code: "// TRUST: checked above.\nconst a = value as Box",
        options: [{ markers: ["TRUST"] }],
      },
    ],
  }
)
