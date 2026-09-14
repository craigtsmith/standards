import type { Definition, ESTree, Scope, SourceCode, Variable } from "@oxlint/plugins"

/**
 * Resolves an identifier by walking up the scope chain from its own scope.
 */
export function resolveVariable(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference
): Variable | null {
  let scope: Scope | null = sourceCode.getScope(identifier)

  while (scope !== null) {
    const variable = scope.set.get(identifier.name)
    if (variable !== undefined) return variable

    scope = scope.upper
  }

  return null
}

/**
 * A variable's definition when it has exactly one.
 */
export function singleDefinition(variable: Variable | null): Definition | undefined {
  return variable?.defs.length === 1 ? variable.defs[0] : undefined
}

/**
 * The declarator of a variable declared exactly once by a variable declaration. Parameters,
 * imports and functions have none.
 */
export function variableDeclarator(variable: Variable): ESTree.VariableDeclarator | null {
  const definition = singleDefinition(variable)

  return definition?.type === "Variable" && definition.node.type === "VariableDeclarator"
    ? definition.node
    : null
}

/**
 * The declarator of a `const` that is never written after its initialiser.
 */
export function stableConstDeclarator(variable: Variable): ESTree.VariableDeclarator | null {
  const declarator = variableDeclarator(variable)
  const isConst =
    declarator?.parent.type === "VariableDeclaration" && declarator.parent.kind === "const"
  const isRewritten = variable.references.some(
    (reference) => reference.isWrite() && !reference.init
  )

  return isConst && !isRewritten ? declarator : null
}
