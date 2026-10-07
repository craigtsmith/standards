import type { ESTree } from "@oxlint/plugins"

import { BROAD_KEY_KEYWORDS } from "./broad-types.ts"
import { visibleTypeAlias } from "./type-alias-resolution.ts"
import { isBuiltIn, isUnappliedReferenceTo, type Resolution } from "./type-references.ts"
import { typeReferenceName, unwrapTransparentType } from "./type-syntax.ts"

/**
 * Whether a mapped-type key admits arbitrary names: `string`, `number` or `symbol`, a union holding
 * one, or a reference that resolves to one.
 */
export function isBroadMappedKey(type: ESTree.TSType, resolution: Resolution): boolean {
  const unwrapped = unwrapTransparentType(type)
  if (BROAD_KEY_KEYWORDS.has(unwrapped.type)) return true

  if (unwrapped.type === "TSUnionType") {
    return unwrapped.types.some((member) => isBroadMappedKey(member, resolution))
  }

  return unwrapped.type === "TSTypeReference" && isBroadKeyReference(unwrapped, resolution)
}

/**
 * Whether a `Record` key admits arbitrary names. A missing key counts as broad, and the check
 * starts with an empty cycle guard.
 */
export function hasBroadRecordKey(key: ESTree.TSType | null, resolution: Resolution): boolean {
  return key === null || isBroadMappedKey(key, { ...resolution, resolving: new Set() })
}

function isBroadKeyReference(reference: ESTree.TSTypeReference, resolution: Resolution): boolean {
  const name = typeReferenceName(reference)
  if (name === null) return false

  const substitution = resolution.substitutions.get(name)
  if (substitution !== undefined && !isUnappliedReferenceTo(substitution, name)) {
    return isBroadMappedKey(substitution, resolution)
  }

  if (name === "PropertyKey" && isBuiltIn(name, reference, resolution.environment)) return true

  const alias = visibleTypeAlias(name, reference, resolution.environment.typeAliases)
  if (
    alias === null ||
    (alias.typeParameters?.params.length ?? 0) > 0 ||
    resolution.resolving.has(name)
  ) {
    return false
  }

  return isBroadMappedKey(alias.typeAnnotation, {
    ...resolution,
    resolving: new Set([...resolution.resolving, name]),
  })
}
