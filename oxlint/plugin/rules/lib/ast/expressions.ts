import type { ESTree } from "@oxlint/plugins"

const SYNTACTIC_VALUES = new Set([
  "ArrayExpression",
  "ArrowFunctionExpression",
  "ClassExpression",
  "FunctionExpression",
  "Literal",
  "NewExpression",
  "ObjectExpression",
  "TemplateLiteral",
  "UnaryExpression",
])

/**
 * Strips parentheses, `as`, `satisfies`, non-null and angle-bracket assertions to reach the
 * underlying expression.
 *
 * @param expression - The expression to unwrap.
 * @returns The innermost expression not wrapped by one of those forms.
 */
export function unwrapExpression(expression: ESTree.Expression): ESTree.Expression {
  let current = expression

  while (
    current.type === "ParenthesizedExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSNonNullExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSTypeAssertion"
  ) {
    current = current.expression
  }

  return current
}

/**
 * Strips parentheses only, leaving assertions and `satisfies` in place.
 *
 * @param expression - The expression to unwrap.
 * @returns The innermost non-parenthesized expression.
 */
export function unwrapExpressionParentheses(expression: ESTree.Expression): ESTree.Expression {
  let current = expression

  while (current.type === "ParenthesizedExpression") current = current.expression

  return current
}

/**
 * Reports whether an expression is a syntactic value whose shape is evident from the source: a
 * literal, template, object, array, function, class, `new` or unary expression.
 *
 * @param expression - The expression to inspect, unwrapped of assertions first.
 * @returns Whether the expression is a syntactic value.
 */
export function isKnownEvidenceExpression(expression: ESTree.Expression): boolean {
  return SYNTACTIC_VALUES.has(unwrapExpression(expression).type)
}

/**
 * Reports whether an expression is an object literal with no properties once parentheses and
 * assertions are removed.
 *
 * @param expression - The expression to inspect.
 * @returns Whether the expression is `{}`.
 */
export function isEmptyObjectExpression(expression: ESTree.Expression): boolean {
  const unwrapped = unwrapExpression(expression)

  return unwrapped.type === "ObjectExpression" && unwrapped.properties.length === 0
}
