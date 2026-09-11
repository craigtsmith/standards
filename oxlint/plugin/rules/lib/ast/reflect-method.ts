import type { ESTree, SourceCode } from "@oxlint/plugins"

import { resolveVariable } from "./variables.ts"

/**
 * Reports whether a callee is `Reflect.<method>` on the global `Reflect`, written with dot or
 * bracket access.
 *
 * @param sourceCode - The source code used to check that `Reflect` is not shadowed.
 * @param callee - The call's callee expression.
 * @param methodName - The Reflect method to match.
 * @returns Whether the callee is that method on the global `Reflect`.
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
