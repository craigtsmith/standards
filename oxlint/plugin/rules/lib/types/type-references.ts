import type { ESTree } from "@oxlint/plugins"

import type { TypeBinding } from "./type-bindings.ts"
import { nearestTypeParameterBinder } from "./lexical-type-parameters.ts"
import {
  expandAlias,
  substitutedType,
  topLevelResolution,
  type Resolution,
  type ResolvedType,
} from "./resolution.ts"
import { visibleTypeBindings, type TypeEnvironment } from "./type-environment.ts"
import { typeArgumentAt, typeReferenceName } from "./type-syntax.ts"

export type ReferenceTarget =
  | (ResolvedType & { readonly generic: boolean; readonly kind: "alias" })
  | (ResolvedType & { readonly kind: "pick" | "substitution" | "wrapped" })
  | { readonly declarations: readonly ESTree.TSInterfaceDeclaration[]; readonly kind: "interface" }
  | { readonly kind: "propertyKey" }
  | {
      readonly key: ESTree.TSType | null
      readonly kind: "record"
      readonly resolution: Resolution
      readonly value: ESTree.TSType | null
    }

export type ResolvedTypeMatcher = (
  type: ESTree.TSType,
  matches: (child: ESTree.TSType) => boolean
) => boolean

// Utility types whose first argument holds the values: `pick` keeps some of its
// keys, `wrapped` keeps them all.
const UTILITY_KINDS: ReadonlyMap<string, "pick" | "wrapped"> = new Map([
  ["NonNullable", "wrapped"],
  ["Omit", "pick"],
  ["Partial", "wrapped"],
  ["Pick", "pick"],
  ["Readonly", "wrapped"],
  ["Required", "wrapped"],
])

/**
 * Resolves a type reference one step: a substituted parameter, an unshadowed built-in utility
 * type, a visible interface, or a visible alias with its arguments bound. Null when the name is
 * unknown, a type parameter with nothing bound, or a cycle.
 */
export function resolveReference(
  reference: ESTree.TSTypeReference,
  resolution: Resolution
): ReferenceTarget | null {
  const name = typeReferenceName(reference)
  if (name === null) return null

  return (
    substitutionTarget(name, reference, resolution) ?? bindingTarget(name, reference, resolution)
  )
}

/**
 * Tests a type against a matcher after following aliases and type parameters to what they stand
 * for. The matcher gets a callback that tests a child type the same way.
 */
export function resolvedTypeMatches(
  type: ESTree.TSType,
  environment: TypeEnvironment,
  matcher: ResolvedTypeMatcher
): boolean {
  const evaluate = ({ resolution, type: current }: ResolvedType): boolean => {
    const target = current.type === "TSTypeReference" ? resolveReference(current, resolution) : null
    if (target?.kind === "alias" || target?.kind === "substitution") return evaluate(target)

    return matcher(current, (child) => evaluate({ resolution, type: child }))
  }

  return evaluate({ resolution: topLevelResolution(environment), type })
}

// A type parameter cannot take type arguments, so `T<X>` is never a
// substitution for `T`.
function substitutionTarget(
  name: string,
  reference: ESTree.TSTypeReference,
  resolution: Resolution
): ReferenceTarget | null {
  if ((reference.typeArguments?.params.length ?? 0) > 0) return null

  const substituted = substitutedType(name, resolution)
  if (substituted === null || !bindsAliasParameter(name, reference, resolution)) return null

  return { ...substituted, kind: "substitution" }
}

// Substitutions belong to the alias being expanded, so a closer binder of the
// same name, such as `<T>() => T` or `infer T`, shadows them.
function bindsAliasParameter(
  name: string,
  reference: ESTree.TSTypeReference,
  resolution: Resolution
): boolean {
  const binder = nearestTypeParameterBinder(name, reference, resolution.environment.visitorKeys)

  return binder?.type === "TSTypeAliasDeclaration"
}

function bindingTarget(
  name: string,
  reference: ESTree.TSTypeReference,
  resolution: Resolution
): ReferenceTarget | null {
  const bindings = visibleTypeBindings(name, reference, resolution.environment)
  if (bindings === null) return null

  return bindings.length === 0
    ? builtInTarget(name, reference, resolution)
    : declaredTarget(bindings, reference, resolution)
}

function builtInTarget(
  name: string,
  reference: ESTree.TSTypeReference,
  resolution: Resolution
): ReferenceTarget | null {
  if (name === "PropertyKey") return { kind: "propertyKey" }

  const first = typeArgumentAt(reference, 0)
  if (name === "Record") {
    return { key: first, kind: "record", resolution, value: typeArgumentAt(reference, 1) }
  }

  const kind = UTILITY_KINDS.get(name)

  return kind === undefined || first === null ? null : { kind, resolution, type: first }
}

function declaredTarget(
  bindings: readonly TypeBinding[],
  reference: ESTree.TSTypeReference,
  resolution: Resolution
): ReferenceTarget | null {
  const declarations = bindings.map((binding) => binding.declaration)
  const interfaces = declarations.filter(
    (declaration) => declaration?.type === "TSInterfaceDeclaration"
  )
  if (interfaces.length === declarations.length) {
    return { declarations: interfaces, kind: "interface" }
  }

  const [alias] = declarations

  return declarations.length === 1 && alias?.type === "TSTypeAliasDeclaration"
    ? aliasTarget(alias, reference, resolution)
    : null
}

function aliasTarget(
  alias: ESTree.TSTypeAliasDeclaration,
  reference: ESTree.TSTypeReference,
  resolution: Resolution
): ReferenceTarget | null {
  const expanded = expandAlias(alias, reference, resolution)
  if (expanded === null) return null

  return { ...expanded, generic: (alias.typeParameters?.params.length ?? 0) > 0, kind: "alias" }
}
