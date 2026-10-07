import type { ESTree } from "@oxlint/plugins"

export interface AliasArgument {
  readonly argument: ESTree.TSType
  readonly explicit: boolean
  readonly parameter: ESTree.TSTypeParameter
}

/**
 * The plain identifier a type reference names, or null for a qualified name.
 */
export function typeReferenceName(type: ESTree.TSTypeReference): string | null {
  return type.typeName.type === "Identifier" ? type.typeName.name : null
}

export function typeArgumentAt(type: ESTree.TSTypeReference, index: number): ESTree.TSType | null {
  return type.typeArguments?.params[index] ?? null
}

/**
 * Strips parentheses and `readonly` operators.
 */
export function unwrapTransparentType(type: ESTree.TSType): ESTree.TSType {
  let current = type

  while (
    current.type === "TSParenthesizedType" ||
    (current.type === "TSTypeOperator" && current.operator === "readonly")
  ) {
    current = current.typeAnnotation
  }

  return current
}

/**
 * Pairs each type parameter of an alias with the argument a reference supplies, falling back to the
 * parameter's default. Null when a parameter has neither.
 */
export function aliasArguments(
  alias: ESTree.TSTypeAliasDeclaration,
  reference: ESTree.TSTypeReference
): readonly AliasArgument[] | null {
  const parameters = alias.typeParameters?.params ?? []
  const supplied = reference.typeArguments?.params ?? []
  const pairs = parameters.flatMap((parameter, index) => aliasArgument(parameter, supplied[index]))

  return pairs.length === parameters.length ? pairs : null
}

// An empty list when the parameter has neither an argument nor a default.
function aliasArgument(
  parameter: ESTree.TSTypeParameter,
  explicit: ESTree.TSType | undefined
): AliasArgument[] {
  const argument = explicit ?? parameter.default

  return argument === null ? [] : [{ argument, explicit: explicit !== undefined, parameter }]
}
