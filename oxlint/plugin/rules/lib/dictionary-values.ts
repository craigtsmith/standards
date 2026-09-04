import type { ESTree } from "@oxlint/plugins"

import { hasBroadRecordKey, isBroadMappedKey } from "./broad-keys.ts"
import { resolveReference, type ReferenceTarget, type Resolution } from "./type-references.ts"
import { unwrapTransparentType } from "./type-syntax.ts"

export interface WideningTarget {
  readonly kind: WideningTargetKind
}

export interface ResolvedType {
  readonly resolution: Resolution
  readonly type: ESTree.TSType
}

export type WideningTargetKind =
  | "anonymous object"
  | "generic container"
  | "object"
  | "open dictionary"
  | "unknown"

const OPEN_DICTIONARY: WideningTarget = { kind: "open dictionary" }

/**
 * Collects the value types a dictionary holds: its index signatures, a mapped type's template, or
 * the value reached through an alias, `Record` or `Pick`.
 *
 * @param type - The candidate dictionary type.
 * @param resolution - The environment and substitutions used to follow references.
 * @returns Each value type paired with the resolution it must be read under.
 */
export function dictionaryValueTypes(
  type: ESTree.TSType,
  resolution: Resolution
): readonly ResolvedType[] {
  const unwrapped = unwrapTransparentType(type)
  if (unwrapped.type === "TSTypeLiteral") return indexSignatureValues(unwrapped, resolution)

  if (unwrapped.type === "TSMappedType") {
    return unwrapped.typeAnnotation === null ? [] : [{ resolution, type: unwrapped.typeAnnotation }]
  }

  if (unwrapped.type !== "TSTypeReference") return []

  return referenceValueTypes(resolveReference(unwrapped, resolution), resolution)
}

/**
 * Classifies a type reached through an alias as `unknown`, `object` or an open dictionary, where a
 * mapped type counts only when its key is broad.
 *
 * @param type - The alias body or other resolved type.
 * @param resolution - The environment and substitutions used to follow references.
 * @returns The widening target kind, or null when the type is neither broad nor
 * open.
 */
export function classifyAliasBroadTarget(
  type: ESTree.TSType,
  resolution: Resolution
): WideningTarget | null {
  const unwrapped = unwrapTransparentType(type)
  if (unwrapped.type === "TSUnknownKeyword") return { kind: "unknown" }

  if (unwrapped.type === "TSObjectKeyword") return { kind: "object" }

  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.some((member) => member.type === "TSIndexSignature")
      ? OPEN_DICTIONARY
      : null
  }

  if (unwrapped.type === "TSMappedType") {
    return isBroadMappedKey(unwrapped.constraint, { ...resolution, resolving: new Set() })
      ? OPEN_DICTIONARY
      : null
  }

  if (unwrapped.type !== "TSTypeReference") return null

  return broadReferenceTarget(resolveReference(unwrapped, resolution), resolution)
}

function indexSignatureValues(
  literal: ESTree.TSTypeLiteral,
  resolution: Resolution
): readonly ResolvedType[] {
  return literal.members.flatMap((member): readonly ResolvedType[] =>
    member.type === "TSIndexSignature"
      ? [{ resolution, type: member.typeAnnotation.typeAnnotation }]
      : []
  )
}

function referenceValueTypes(
  target: ReferenceTarget | null,
  resolution: Resolution
): readonly ResolvedType[] {
  if (target === null) return []

  switch (target.kind) {
    case "alias":
      return dictionaryValueTypes(target.type, target.resolution)
    case "pick":
      return dictionaryValueTypes(target.source, resolution)
    case "record":
      return target.value === null ? [] : [{ resolution, type: target.value }]
    case "substitution":
    case "wrapped":
      return dictionaryValueTypes(target.type, resolution)
    default:
      return []
  }
}

function broadReferenceTarget(
  target: ReferenceTarget | null,
  resolution: Resolution
): WideningTarget | null {
  if (target === null) return null

  switch (target.kind) {
    case "alias":
      return classifyAliasBroadTarget(target.type, target.resolution)
    case "record":
      return hasBroadRecordKey(target.key, resolution) ? OPEN_DICTIONARY : null
    case "substitution":
    case "wrapped":
      return classifyAliasBroadTarget(target.type, resolution)
    default:
      return null
  }
}
