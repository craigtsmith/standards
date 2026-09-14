import type { ESTree } from "@oxlint/plugins"

import type { TypeEnvironment } from "./type-environment.ts"
import { hasBroadRecordKey } from "./broad-keys.ts"
import {
  classifyAliasBroadTarget,
  dictionaryValueTypes,
  type WideningTarget,
} from "./dictionary-values.ts"
import { resolveReference, topLevelResolution, type ReferenceTarget } from "./type-references.ts"
import { unwrapTransparentType } from "./type-syntax.ts"
import { unsafeDirectValue, type UnsafeValue } from "./unsafe-values.ts"

export type { WideningTarget } from "./dictionary-values.ts"
export { createTypeEnvironment, type TypeEnvironment } from "./type-environment.ts"

export interface UnsafeDictionary {
  readonly kind: "unsafe-dictionary"
  readonly unsafeValue: UnsafeValue
}

type AliasTarget = Extract<ReferenceTarget, { kind: "alias" }>

/**
 * Classifies a dictionary value type on its own, for callers that already hold the value rather
 * than the dictionary, such as an interface index signature.
 *
 * @param valueType - The value type to inspect.
 * @param environment - The file's interfaces and type aliases.
 * @returns The unsafe classification, or null when the value type is concrete.
 */
export function classifyUnsafeDictionaryValue(
  valueType: ESTree.TSType,
  environment: TypeEnvironment
): UnsafeDictionary | null {
  return unsafeDictionary(unsafeDirectValue(valueType, topLevelResolution(environment)))
}

/**
 * Finds the first value type of a dictionary that is `unknown`, `any`, `object`, `{}` or a union
 * carrying one, following aliases, `Record` and `Pick`.
 *
 * @param type - The candidate dictionary type.
 * @param environment - The file's interfaces and type aliases.
 * @returns The unsafe classification, or null when every value type is
 * concrete.
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
 *
 * @param type - The annotated type an expression flows into.
 * @param environment - The file's interfaces and type aliases.
 * @returns The destination kind, or null when the type is not a widening
 * target.
 */
export function classifyWideningTarget(
  type: ESTree.TSType,
  environment: TypeEnvironment
): WideningTarget | null {
  const unwrapped = unwrapTransparentType(type)
  if (unwrapped.type === "TSUnknownKeyword") return { kind: "unknown" }

  if (unwrapped.type === "TSObjectKeyword") return { kind: "object" }

  if (unwrapped.type === "TSTypeLiteral") return literalTarget(unwrapped)

  if (unwrapped.type === "TSMappedType") return { kind: "open dictionary" }

  if (unwrapped.type !== "TSTypeReference") return null

  return referenceWideningTarget(
    resolveReference(unwrapped, topLevelResolution(environment)),
    environment
  )
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
      return hasBroadRecordKey(target.key, topLevelResolution(environment))
        ? { kind: "open dictionary" }
        : null
    case "wrapped":
      return classifyWideningTarget(target.type, environment)
    default:
      return null
  }
}
