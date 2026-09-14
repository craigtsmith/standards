import type { ESTree } from "@oxlint/plugins"

/**
 * Strips parentheses, `as`, `satisfies`, non-null and angle-bracket assertions.
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
 */
export function unwrapExpressionParentheses(expression: ESTree.Expression): ESTree.Expression {
  let current = expression

  while (current.type === "ParenthesizedExpression") current = current.expression

  return current
}

/**
 * Whether an expression is `{}` once parentheses and assertions are removed.
 */
export function isEmptyObjectExpression(expression: ESTree.Expression): boolean {
  const unwrapped = unwrapExpression(expression)

  return unwrapped.type === "ObjectExpression" && unwrapped.properties.length === 0
}
