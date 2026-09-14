import type { ESTree } from "@oxlint/plugins"

import type { Resolution } from "./resolution.ts"
import { resolveReference } from "./type-references.ts"
import { BROAD_KEY_KEYWORDS, unwrapTransparentType } from "./type-syntax.ts"

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
  const target = resolveReference(reference, resolution)

  switch (target?.kind) {
    case "alias":
    case "substitution":
      return isBroadMappedKey(target.type, target.resolution)
    case "propertyKey":
      return true
    default:
      return false
  }
}
