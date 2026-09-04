import type { Definition, ESTree, Scope, SourceCode, Variable } from "@oxlint/plugins"

/**
 * Resolves an identifier to its variable by walking up the scope chain from the identifier's scope.
 *
 * @param sourceCode - The source code whose scope manager is searched.
 * @param identifier - The identifier reference to resolve.
 * @returns The variable, or null when no enclosing scope declares the name.
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
 * Gives a variable's definition when it has exactly one.
 *
 * @param variable - The variable to inspect, or null.
 * @returns The sole definition, or undefined when there is none or more than
 * one.
 */
export function singleDefinition(variable: Variable | null): Definition | undefined {
  return variable?.defs.length === 1 ? variable.defs[0] : undefined
}

/**
 * Finds the declarator that defines a variable when it is declared exactly once by a variable
 * declaration.
 *
 * @param variable - The variable to inspect.
 * @returns The declarator, or null for a parameter, import, function, or
 * multiply-defined variable.
 */
export function variableDeclarator(variable: Variable): ESTree.VariableDeclarator | null {
  const definition = singleDefinition(variable)

  return definition?.type === "Variable" && definition.node.type === "VariableDeclarator"
    ? definition.node
    : null
}

/**
 * Reports whether a variable is a `const` that is never written after its initialiser.
 *
 * @param variable - The variable whose references are checked.
 * @param declarator - The declarator that defines the variable.
 * @returns Whether the binding's value cannot change.
 */
export function isStableConstVariable(
  variable: Variable,
  declarator: ESTree.VariableDeclarator
): boolean {
  return (
    declarator.parent.type === "VariableDeclaration" &&
    declarator.parent.kind === "const" &&
    variable.references.every((reference) => reference.init || !reference.isWrite())
  )
}
