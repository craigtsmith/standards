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
  if (!("property" in callee) || !("object" in callee) || !("computed" in callee)) return false

  if (!isGlobalReflect(sourceCode, callee.object)) return false

  const property = callee.property

  return callee.computed
    ? property.type === "Literal" && property.value === methodName
    : property.type === "Identifier" && property.name === methodName
}

function isGlobalReflect(sourceCode: SourceCode, expression: ESTree.Expression): boolean {
  if (expression.type !== "Identifier" || expression.name !== "Reflect") return false

  if (sourceCode.isGlobalReference(expression)) return true

  const variable = resolveVariable(sourceCode, expression)

  return variable === null || variable.defs.length === 0
}
