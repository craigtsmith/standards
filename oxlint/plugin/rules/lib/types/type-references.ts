import type { ESTree } from "@oxlint/plugins"

import type { TypeEnvironment } from "./type-environment.ts"
import { aliasSubstitution, type Resolution } from "./resolution.ts"
import { hasVisibleTypeBinding, visibleTypeAlias } from "./type-alias-resolution.ts"
import { typeArgumentAt, typeReferenceName, unwrapTransparentType } from "./type-syntax.ts"

const BUILT_INS = new Set([
  "NonNullable",
  "Omit",
  "Partial",
  "Pick",
  "PropertyKey",
  "Readonly",
  "Record",
  "Required",
])
const TRANSPARENT_WRAPPERS = new Set(["NonNullable", "Partial", "Readonly", "Required"])

export type ReferenceTarget =
  | {
      readonly generic: boolean
      readonly kind: "alias"
      readonly resolution: Resolution
      readonly type: ESTree.TSType
    }
  | { readonly declarations: readonly ESTree.TSInterfaceDeclaration[]; readonly kind: "interface" }
  | {
      readonly key: ESTree.TSType | null
      readonly kind: "record"
      readonly value: ESTree.TSType | null
    }
  | { readonly kind: "pick"; readonly source: ESTree.TSType }
  | { readonly kind: "propertyKey" }
  | { readonly kind: "substitution"; readonly type: ESTree.TSType }
  | { readonly kind: "unapplied" }
  | { readonly kind: "wrapped"; readonly type: ESTree.TSType }

export { topLevelResolution, type Resolution } from "./resolution.ts"
/**
 * Reports whether a name refers to one of the TypeScript utility types this module understands,
 * rather than to a local binding that shadows it.
 *
 * @param name - The referenced name.
 * @param use - The node where the name is used.
 * @param environment - The file's interfaces and type aliases.
 * @returns Whether the name is an unshadowed built-in.
 */
export function isBuiltIn(name: string, use: ESTree.Node, environment: TypeEnvironment): boolean {
  return BUILT_INS.has(name) && !hasVisibleTypeBinding(name, use, environment.typeAliases)
}

/**
 * Reports whether a type is a bare reference to the given name with no type arguments, which marks
 * a substitution that maps a parameter to itself.
 *
 * @param type - The type to inspect.
 * @param name - The name the reference must carry.
 * @returns Whether the type is an argument-free reference to the name.
 */
export function isUnappliedReferenceTo(type: ESTree.TSType, name: string): boolean {
  const unwrapped = unwrapTransparentType(type)

  return (
    unwrapped.type === "TSTypeReference" &&
    typeReferenceName(unwrapped) === name &&
    (unwrapped.typeArguments === null || unwrapped.typeArguments.params.length === 0)
  )
}

/**
 * Resolves a type reference one step: a substituted parameter, a built-in utility type, a local
 * interface, or an alias with its arguments bound.
 *
 * @param reference - The reference to resolve.
 * @param resolution - The environment, substitutions and aliases in progress.
 * @returns What the reference names, or null when it is unknown or a cycle.
 */
export function resolveReference(
  reference: ESTree.TSTypeReference,
  resolution: Resolution
): ReferenceTarget | null {
  const name = typeReferenceName(reference)
  if (name === null) return null

  const substitution = resolution.substitutions.get(name)
  if (substitution !== undefined) return substitutionTarget(substitution, name)

  const builtIn = builtInTarget(name, reference, resolution.environment)
  if (builtIn !== null) return builtIn

  const declarations = resolution.environment.interfaces.get(name)
  if (declarations !== undefined) return { declarations, kind: "interface" }

  return aliasTarget(name, reference, resolution)
}

function substitutionTarget(type: ESTree.TSType, name: string): ReferenceTarget {
  return isUnappliedReferenceTo(type, name) ? { kind: "unapplied" } : { kind: "substitution", type }
}

function builtInTarget(
  name: string,
  reference: ESTree.TSTypeReference,
  environment: TypeEnvironment
): ReferenceTarget | null {
  if (!isBuiltIn(name, reference, environment)) return null

  const first = typeArgumentAt(reference, 0)
  if (TRANSPARENT_WRAPPERS.has(name))
    return first === null ? null : { kind: "wrapped", type: first }

  if (name === "Record") return { key: first, kind: "record", value: typeArgumentAt(reference, 1) }

  if (name === "PropertyKey") return { kind: "propertyKey" }

  return first === null ? null : { kind: "pick", source: first }
}

function aliasTarget(
  name: string,
  reference: ESTree.TSTypeReference,
  resolution: Resolution
): ReferenceTarget | null {
  const alias = visibleTypeAlias(name, reference, resolution.environment.typeAliases)
  if (alias === null || resolution.resolving.has(name)) return null

  const substitutions = aliasSubstitution(alias, reference, resolution.substitutions)
  if (substitutions === null) return null

  return {
    generic: (alias.typeParameters?.params.length ?? 0) > 0,
    kind: "alias",
    type: alias.typeAnnotation,
    resolution: {
      ...resolution,
      resolving: new Set([...resolution.resolving, name]),
      substitutions,
    },
  }
}
