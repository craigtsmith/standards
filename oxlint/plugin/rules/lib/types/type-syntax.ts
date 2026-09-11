import type { ESTree } from "@oxlint/plugins"

export interface AliasArgument {
  readonly argument: ESTree.TSType
  readonly explicit: boolean
  readonly parameter: ESTree.TSTypeParameter
}

/**
 * Reads the plain identifier a type reference names.
 *
 * @param type - The type reference.
 * @returns The name, or null when the reference is a qualified name.
 */
export function typeReferenceName(type: ESTree.TSTypeReference): string | null {
  return type.typeName.type === "Identifier" ? type.typeName.name : null
}

/**
 * Reads one type argument of a reference by position.
 *
 * @param type - The type reference.
 * @param index - The zero-based argument position.
 * @returns The argument, or null when the reference has none at that position.
 */
export function typeArgumentAt(type: ESTree.TSTypeReference, index: number): ESTree.TSType | null {
  return type.typeArguments?.params[index] ?? null
}

/**
 * Strips parentheses and `readonly` operators to reach the type they wrap.
 *
 * @param type - The type to unwrap.
 * @returns The innermost type not wrapped by either form.
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
 * Pairs each type parameter of an alias with the argument a reference supplies for it, falling back
 * to the parameter's default.
 *
 * @param alias - The alias whose parameters are paired.
 * @param reference - The reference supplying the arguments.
 * @returns The pairs in parameter order, or null when a parameter has neither an argument nor a
 *   default.
 */
export function aliasArguments(
  alias: ESTree.TSTypeAliasDeclaration,
  reference: ESTree.TSTypeReference
): readonly AliasArgument[] | null {
  const parameters = alias.typeParameters?.params ?? []
  const supplied = reference.typeArguments?.params ?? []
  const pairs: AliasArgument[] = []

  for (const [index, parameter] of parameters.entries()) {
    const explicit = supplied[index]
    const argument = explicit ?? parameter.default
    if (argument === null) return null

    pairs.push({ argument, explicit: explicit !== undefined, parameter })
  }

  return pairs
}
