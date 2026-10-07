import type { ESTree } from "@oxlint/plugins"

import { unwrapExpression } from "../ast/expressions.ts"

// Expressions whose shape the source states: literals, templates, objects,
// arrays, functions, classes and `new`.
export const SHAPED_VALUES: ReadonlySet<string> = new Set([
  "ArrayExpression",
  "ArrowFunctionExpression",
  "ClassExpression",
  "FunctionExpression",
  "Literal",
  "NewExpression",
  "ObjectExpression",
  "TemplateLiteral",
])

// `no-known-value-widening` also takes a unary expression such as `-1` as
// known. `no-widen-then-assert` reads `SHAPED_VALUES` and has never done so.
const KNOWN_VALUES: ReadonlySet<string> = new Set([...SHAPED_VALUES, "UnaryExpression"])

/**
 * Whether an expression, once assertions are removed, is a value whose shape the source states: a
 * literal, template, object, array, function, class, `new` or unary expression.
 */
export function isKnownValueExpression(expression: ESTree.Expression): boolean {
  return KNOWN_VALUES.has(unwrapExpression(expression).type)
}
