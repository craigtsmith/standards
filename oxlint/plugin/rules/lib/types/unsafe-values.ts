import type { ESTree } from "@oxlint/plugins"

import type { Resolution } from "./resolution.ts"
import { resolveReference, type ReferenceTarget } from "./type-references.ts"
import { unwrapTransparentType } from "./type-syntax.ts"

export type UnsafeValue = "any" | "empty-object" | "object" | "union" | "unknown"

const keywordValues: ReadonlyMap<string, UnsafeValue> = new Map([
  ["TSAnyKeyword", "any"],
  ["TSObjectKeyword", "object"],
  ["TSUnknownKeyword", "unknown"],
])

/**
 * Classifies a type as an unsafe dictionary value: `any`, `unknown`, `object`, an empty object
 * type, or a union or intersection built from those. Null when the type is safe.
 */
export function unsafeDirectValue(type: ESTree.TSType, resolution: Resolution): UnsafeValue | null {
  const unwrapped = unwrapTransparentType(type)

  return keywordValues.get(unwrapped.type) ?? unsafeCompositeValue(unwrapped, resolution)
}

function unsafeCompositeValue(type: ESTree.TSType, resolution: Resolution): UnsafeValue | null {
  switch (type.type) {
    case "TSIntersectionType":
      return unsafeIntersection(type.types, resolution)
    case "TSTypeLiteral":
      return unsafeTypeLiteral(type)
    case "TSTypeReference":
      return unsafeReference(resolveReference(type, resolution))
    case "TSUnionType":
      return unsafeUnion(type.types, resolution)
    default:
      return null
  }
}

function unsafeTypeLiteral(literal: ESTree.TSTypeLiteral): UnsafeValue | null {
  return isEffectivelyEmptyTypeLiteral(literal) ? "empty-object" : null
}

function isNeverType(type: ESTree.TSType): boolean {
  return unwrapTransparentType(type).type === "TSNeverKeyword"
}

function isEffectivelyEmptyMember(member: ESTree.TSSignature): boolean {
  return (
    member.type === "TSPropertySignature" &&
    member.optional &&
    member.typeAnnotation !== null &&
    isNeverType(member.typeAnnotation.typeAnnotation)
  )
}

function isEffectivelyEmptyTypeLiteral(type: ESTree.TSTypeLiteral): boolean {
  return type.members.length === 0 || type.members.every(isEffectivelyEmptyMember)
}

function isEffectivelyEmptyInterface(
  declarations: readonly ESTree.TSInterfaceDeclaration[]
): boolean {
  const [type] = declarations
  if (declarations.length !== 1 || type === undefined) return false

  return (
    type.extends.length === 0 &&
    (type.body.body.length === 0 || type.body.body.every(isEffectivelyEmptyMember))
  )
}

function unsafeUnion(types: readonly ESTree.TSType[], resolution: Resolution): UnsafeValue | null {
  return types.some((member) => unsafeDirectValue(member, resolution) !== null) ? "union" : null
}

function unsafeIntersection(
  types: readonly ESTree.TSType[],
  resolution: Resolution
): UnsafeValue | null {
  const members = types.map((member) => unsafeDirectValue(member, resolution))
  if (members.includes("any")) return "any"

  return members.every((member) => member !== null) ? (members[0] ?? null) : null
}

function unsafeReference(target: ReferenceTarget | null): UnsafeValue | null {
  switch (target?.kind) {
    case "alias":
    case "substitution":
    case "wrapped":
      return unsafeDirectValue(target.type, target.resolution)
    case "interface":
      return isEffectivelyEmptyInterface(target.declarations) ? "empty-object" : null
    default:
      return null
  }
}
