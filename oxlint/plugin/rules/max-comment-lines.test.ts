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

const DOC = "/**\n * one\n * two\n * three\n */\n"
const INDENTED_DOC = "  /**\n   * one\n   * two\n   * three\n   */\n"
const unexported = looseJsdoc(5, "documents an unexported declaration")
const header = { messageId: "header" }

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
      code: `const a = 1\n${DOC}`,
      errors: [looseJsdoc(5, "documents nothing")],
    },
    // A JSDoc-shaped block with text on its opening line is malformed.
    {
      code: "/** one\n * two\n * three\n */\nexport function f() {}",
      errors: [looseJsdoc(4, "has text on its opening line")],
    },
    {
      code: "/**\n * one\n two\n * three\n */\nexport function f() {}",
      errors: [looseJsdoc(5, "has a line without a leading *")],
    },
    // A JSDoc-shaped block on something the module keeps to itself is a comment.
    { code: `\n${DOC}const iconLookup = { note: 1 }`, errors: [unexported] },
    { code: `\n${DOC}function f() {}`, errors: [unexported] },
    { code: `\n${DOC}class C {}`, errors: [unexported] },
    { code: `\n${DOC}interface I { a: number }`, errors: [unexported] },
    { code: `\n${DOC}type T = number`, errors: [unexported] },
    { code: `\n${DOC}enum E { A }`, errors: [unexported] },
    { code: `\n${DOC}import { a } from "./a.ts"\nexport { a }`, errors: [unexported] },
    { code: `import { a } from "./a.ts"\n${DOC}const b = a\nconsole.log(b)`, errors: [unexported] },
    // Members and properties take their visibility from the declaration around them.
    { code: `class C {\n${INDENTED_DOC}  method() {}\n}`, errors: [unexported] },
    { code: `const o = {\n${INDENTED_DOC}  a: 1,\n}\nconsole.log(o)`, errors: [unexported] },
    // A function body is local scope, however the function is exported.
    { code: `export function f() {\n${INDENTED_DOC}  const a = 1\n}`, errors: [unexported] },
    // Exporting another name does not cover this one.
    { code: `\n${DOC}const a = 1\nconst b = 2\nexport { b }`, errors: [unexported] },
    // A block on line 1 that runs straight into code is JSDoc for that code, or
    // a header missing its blank line. Whichever it was meant as, that is the fix.
    { code: `${DOC}const iconLookup = { note: 1 }`, errors: [header] },
    { code: `${DOC}import { a } from "./a.ts"\nexport { a }`, errors: [header] },
    { code: `${DOC}console.log(1)`, errors: [header] },
    { code: `#!/usr/bin/env node\n${DOC}const a = 1`, errors: [header] },
    // Two blocks on line 1 cannot both be the header.
    { code: `${DOC}\n${DOC}const a = 1`, errors: [unexported] },
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
    // A well-formed JSDoc block on an exported declaration has no limit.
    `${DOC}export function f() {}`,
    `${DOC}export const a = 1`,
    `${DOC}export default function f() {}`,
    `${DOC}export default class C {}`,
    `${DOC}export interface I { a: number }`,
    `${DOC}export type T = number`,
    `${DOC}export enum E { A }`,
    // Members and properties of an exported declaration are part of its surface.
    `export class C {\n${INDENTED_DOC}  method() {}\n}`,
    `export interface I {\n${INDENTED_DOC}  a: number\n}`,
    `export const o = {\n${INDENTED_DOC}  a: 1,\n}`,
    // Exporting by name counts, whichever form the export takes.
    `${DOC}const a = 1\nexport { a }`,
    `${DOC}const a = 1\nexport { a as b }`,
    `${DOC}const a = 1\nexport default a`,
    `${DOC}const a = 1\nexport = a`,
    // Ambient declarations are public by definition.
    `${DOC}declare const a: number`,
    `declare module "m" {\n${INDENTED_DOC}  const a: number\n}`,
    `declare global {\n${INDENTED_DOC}  interface Window { a: number }\n}`,
    { code: `${DOC}interface I { a: number }`, filename: "types.d.ts" },
    // A block on line 1 followed by a blank line is the file header, whatever it says.
    `${DOC}\nconst a = 1`,
    `${DOC}\nconsole.log(1)`,
    `${DOC}\n\nimport { a } from "./a.ts"\nexport { a }`,
    `#!/usr/bin/env node\n${DOC}\nconst a = 1`,
    DOC,
    { code: "// one\n// two\n// three\nconst a = 1", options: [{ max: 3 }] },
  ],
})
