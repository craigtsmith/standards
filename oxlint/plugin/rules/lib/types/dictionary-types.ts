import type { ESTree } from "@oxlint/plugins"

import type { TypeEnvironment } from "./type-environment.ts"
import { hasBroadRecordKey } from "./broad-keys.ts"
import {
  classifyAliasBroadTarget,
  dictionaryValueTypes,
  keywordWideningTarget,
  type WideningTarget,
} from "./dictionary-values.ts"
import { topLevelResolution } from "./resolution.ts"
import { resolveReference, type ReferenceTarget } from "./type-references.ts"
import { unwrapTransparentType } from "./type-syntax.ts"
import { unsafeDirectValue, type UnsafeValue } from "./unsafe-values.ts"

export interface UnsafeDictionary {
  readonly kind: "unsafe-dictionary"
  readonly unsafeValue: UnsafeValue
}

type AliasTarget = Extract<ReferenceTarget, { kind: "alias" }>

/**
 * Classifies a dictionary value type on its own, for callers that hold only the value, such as an
 * interface index signature.
 */
export function classifyUnsafeDictionaryValue(
  valueType: ESTree.TSType,
  environment: TypeEnvironment
): UnsafeDictionary | null {
  return unsafeDictionary(unsafeDirectValue(valueType, topLevelResolution(environment)))
}

/**
 * The first value type of a dictionary that is `unknown`, `any`, `object`, `{}` or a union holding
 * one, following aliases, `Record` and `Pick`. Null when every value type is concrete.
 */
export function classifyUnsafeDictionary(
  type: ESTree.TSType,
  environment: TypeEnvironment
): UnsafeDictionary | null {
  for (const value of dictionaryValueTypes(type, topLevelResolution(environment))) {
    const unsafe = unsafeDictionary(
      unsafeDirectValue(value.type, { ...value.resolution, resolving: new Set() })
    )
    if (unsafe !== null) return unsafe
  }

  return null
}

/**
 * Classifies an annotation as a widening destination: `unknown`, `object`, an anonymous object
 * literal, an open dictionary, or a generic container alias.
 */
export function classifyWideningTarget(
  type: ESTree.TSType,
  environment: TypeEnvironment
): WideningTarget | null {
  const unwrapped = unwrapTransparentType(type)

  return keywordWideningTarget(unwrapped) ?? compositeWideningTarget(unwrapped, environment)
}

function compositeWideningTarget(
  type: ESTree.TSType,
  environment: TypeEnvironment
): WideningTarget | null {
  switch (type.type) {
    case "TSMappedType":
      return { kind: "open dictionary" }
    case "TSTypeLiteral":
      return literalTarget(type)
    case "TSTypeReference":
      return referenceWideningTarget(
        resolveReference(type, topLevelResolution(environment)),
        environment
      )
    default:
      return null
  }
}

function unsafeDictionary(unsafeValue: UnsafeValue | null): UnsafeDictionary | null {
  return unsafeValue === null ? null : { kind: "unsafe-dictionary", unsafeValue }
}

function literalTarget(literal: ESTree.TSTypeLiteral): WideningTarget | null {
  if (literal.members.some((member) => member.type === "TSIndexSignature")) {
    return { kind: "open dictionary" }
  }

  return literal.members.length > 0 ? { kind: "anonymous object" } : null
}

function aliasWideningTarget(target: AliasTarget): WideningTarget | null {
  const resolved = classifyAliasBroadTarget(target.type, target.resolution)
  if (!target.generic) return resolved

  return resolved?.kind === "open dictionary" ? { kind: "generic container" } : null
}

function referenceWideningTarget(
  target: ReferenceTarget | null,
  environment: TypeEnvironment
): WideningTarget | null {
  if (target === null) return null

  switch (target.kind) {
    case "alias":
      return aliasWideningTarget(target)
    case "record":
      return hasBroadRecordKey(target.key, target.resolution) ? { kind: "open dictionary" } : null
    case "wrapped":
      return classifyWideningTarget(target.type, environment)
    default:
      return null
  }
}
