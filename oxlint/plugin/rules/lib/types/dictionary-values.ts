import type { ESTree } from "@oxlint/plugins"

import type { Resolution, ResolvedType } from "./resolution.ts"
import { hasBroadRecordKey, isBroadMappedKey } from "./broad-keys.ts"
import { resolveReference, type ReferenceTarget } from "./type-references.ts"
import { unwrapTransparentType } from "./type-syntax.ts"

export interface WideningTarget {
  readonly kind: WideningTargetKind
}

export type WideningTargetKind =
  | "anonymous object"
  | "generic container"
  | "object"
  | "open dictionary"
  | "unknown"

const OPEN_DICTIONARY: WideningTarget = { kind: "open dictionary" }

const KEYWORD_TARGETS: ReadonlyMap<string, WideningTarget> = new Map([
  ["TSObjectKeyword", { kind: "object" }],
  ["TSUnknownKeyword", { kind: "unknown" }],
])

/**
 * The value types a dictionary holds, each with the resolution it is read under: its index
 * signatures, a mapped type's template, or the value reached through an alias, `Record` or `Pick`.
 */
export function dictionaryValueTypes(
  type: ESTree.TSType,
  resolution: Resolution
): readonly ResolvedType[] {
  const unwrapped = unwrapTransparentType(type)

  switch (unwrapped.type) {
    case "TSMappedType":
      return mappedTemplateValues(unwrapped, resolution)
    case "TSTypeLiteral":
      return indexSignatureValues(unwrapped, resolution)
    case "TSTypeReference":
      return referenceValueTypes(resolveReference(unwrapped, resolution))
    default:
      return []
  }
}

/**
 * Classifies a type reached through an alias as `unknown`, `object` or an open dictionary. A mapped
 * type counts only when its key is broad.
 */
export function classifyAliasBroadTarget(
  type: ESTree.TSType,
  resolution: Resolution
): WideningTarget | null {
  const unwrapped = unwrapTransparentType(type)

  return keywordWideningTarget(unwrapped) ?? compositeBroadTarget(unwrapped, resolution)
}

/**
 * The widening target the `unknown` and `object` keywords stand for, or null for any other type.
 */
export function keywordWideningTarget(type: ESTree.TSType): WideningTarget | null {
  return KEYWORD_TARGETS.get(type.type) ?? null
}

function compositeBroadTarget(type: ESTree.TSType, resolution: Resolution): WideningTarget | null {
  switch (type.type) {
    case "TSMappedType":
      return openDictionaryWhen(
        isBroadMappedKey(type.constraint, { ...resolution, resolving: new Set() })
      )
    case "TSTypeLiteral":
      return openDictionaryWhen(hasIndexSignature(type))
    case "TSTypeReference":
      return broadReferenceTarget(resolveReference(type, resolution))
    default:
      return null
  }
}

function openDictionaryWhen(open: boolean): WideningTarget | null {
  return open ? OPEN_DICTIONARY : null
}

function hasIndexSignature(literal: ESTree.TSTypeLiteral): boolean {
  return literal.members.some((member) => member.type === "TSIndexSignature")
}

function mappedTemplateValues(
  mapped: ESTree.TSMappedType,
  resolution: Resolution
): readonly ResolvedType[] {
  return mapped.typeAnnotation === null ? [] : [{ resolution, type: mapped.typeAnnotation }]
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

function referenceValueTypes(target: ReferenceTarget | null): readonly ResolvedType[] {
  switch (target?.kind) {
    case "alias":
    case "pick":
    case "substitution":
    case "wrapped":
      return dictionaryValueTypes(target.type, target.resolution)
    case "record":
      return target.value === null ? [] : [{ resolution: target.resolution, type: target.value }]
    default:
      return []
  }
}

function broadReferenceTarget(target: ReferenceTarget | null): WideningTarget | null {
  switch (target?.kind) {
    case "alias":
    case "substitution":
    case "wrapped":
      return classifyAliasBroadTarget(target.type, target.resolution)
    case "record":
      return hasBroadRecordKey(target.key, target.resolution) ? OPEN_DICTIONARY : null
    default:
      return null
  }
}
