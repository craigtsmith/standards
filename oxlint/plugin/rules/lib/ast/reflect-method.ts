import type { ESTree, SourceCode } from "@oxlint/plugins"

import { resolveVariable } from "./variables.ts"

/**
 * Whether a callee is `Reflect.<methodName>` on an unshadowed `Reflect`, by dot or bracket.
 */
export function isGlobalReflectMethodCall(
  sourceCode: SourceCode,
  callee: ESTree.Expression,
  methodName: string
): boolean {
  if (callee.type !== "MemberExpression") return false

  return isGlobalReflect(sourceCode, callee.object) && isPropertyNamed(callee, methodName)
}

// A computed key must be the string literal itself; a dotted key is an identifier.
function isPropertyNamed(member: ESTree.MemberExpression, name: string): boolean {
  return member.computed
    ? isLiteralOf(member.property, name)
    : isIdentifierNamed(member.property, name)
}

function isLiteralOf(node: ESTree.Node, value: string): boolean {
  return node.type === "Literal" && node.value === value
}

function isIdentifierNamed(node: ESTree.Node, name: string): boolean {
  return node.type === "Identifier" && node.name === name
}

function isGlobalReflect(sourceCode: SourceCode, expression: ESTree.Expression): boolean {
  if (expression.type !== "Identifier" || expression.name !== "Reflect") return false

  if (sourceCode.isGlobalReference(expression)) return true

  const variable = resolveVariable(sourceCode, expression)

  return variable === null || variable.defs.length === 0
}
