import { maxCommentLinesRule } from "./max-comment-lines.ts"
import { ruleTester } from "./rule-tester.ts"

const looseJsdoc = (lines: number, why: string, max = 2) => ({
  data: { lines: String(lines), max: String(max), why },
  messageId: "looseJsdoc",
})

const tooLong = (lines: number, max = 2) => ({
  data: { lines: String(lines), max: String(max) },
  messageId: "tooLong",
})

ruleTester.run("max-comment-lines", maxCommentLinesRule, {
  invalid: [
    { code: "// one\n// two\n// three\nconst a = 1", errors: [tooLong(3)] },
    { code: "/* one\n   two\n   three */\nconst a = 1", errors: [tooLong(3)] },
    // A line holding only `//` bridges the run.
    { code: "// one\n//\n// three\nconst a = 1", errors: [tooLong(3)] },
    // A single blank line bridges the run too, and counts as a line of it.
    { code: "// one\n// two\n\n// three\n// four\nconst a = 1", errors: [tooLong(5)] },
    { code: "// one\n// two\nconst a = 1", errors: [tooLong(2, 1)], options: [{ max: 1 }] },
    // A JSDoc-shaped block with nothing after it documents nothing.
    {
      code: "const a = 1\n/**\n * one\n * two\n * three\n */",
      errors: [looseJsdoc(5, "documents nothing")],
    },
    // A JSDoc-shaped block with text on its opening line is malformed.
    {
      code: "/** one\n * two\n * three\n */\nfunction f() {}",
      errors: [looseJsdoc(4, "has text on its opening line")],
    },
    {
      code: "/**\n * one\n two\n * three\n */\nfunction f() {}",
      errors: [looseJsdoc(5, "has a line without a leading *")],
    },
    {
      code: "// one\n// two\n// three\n// four\nconst a = 1",
      errors: [tooLong(4, 3)],
      options: [{ max: 3 }],
    },
  ],
  valid: [
    "// one\nconst a = 1",
    "// one\n// two\nconst a = 1",
    "/* one\n   two */\nconst a = 1",
    // Two blank lines end a run of line comments; one does not.
    "// one\n// two\n\n\n// three\nconst a = 1",
    // A well-formed JSDoc block on a declaration has no limit.
    "/**\n * one\n * two\n * three\n */\nfunction f() {}",
    "/**\n * one\n * two\n * three\n */\nexport const a = 1",
    "/**\n * one\n * two\n * three\n */\nclass C {\n  /**\n   * one\n   * two\n   * three\n   */\n  method() {}\n}",
    { code: "// one\n// two\n// three\nconst a = 1", options: [{ max: 3 }] },
  ],
})
