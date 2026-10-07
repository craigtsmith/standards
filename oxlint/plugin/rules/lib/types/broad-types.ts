import type { ESTree } from "@oxlint/plugins"

import { typeReferenceName } from "./type-syntax.ts"

export type BroadTypeKind = "object" | "record" | "top"

// Key types that admit any property name.
export const BROAD_KEY_KEYWORDS: ReadonlySet<string> = new Set([
  "TSNumberKeyword",
  "TSStringKeyword",
  "TSSymbolKeyword",
])

// Types that are objects whatever their contents.
const OBJECT_TYPES: ReadonlySet<string> = new Set([
  "TSArrayType",
  "TSConstructorType",
  "TSFunctionType",
  "TSMappedType",
  "TSObjectKeyword",
  "TSTupleType",
])

/**
 * Classifies a type that widens a value: `unknown` or `any` is `top`, the `object` keyword is
 * `object`, and a `Record` or index signature with an `unknown` value is `record`.
 */
export function broadTypeKind(type: ESTree.TSType): BroadTypeKind | null {
  const unwrapped = unwrapTypeParentheses(type)
  if (isUnknownOrAnyType(unwrapped)) return "top"

  if (unwrapped.type === "TSObjectKeyword") return "object"

  return isBroadRecordType(unwrapped) ? "record" : null
}

/**
 * Whether both types are present and written the same, ignoring whitespace and outer parentheses.
 */
export function typesHaveSameSyntax(
  sourceText: string,
  left: ESTree.TSType | null,
  right: ESTree.TSType
): boolean {
  return (
    left !== null &&
    normalizedTypeText(sourceText, unwrapTypeParentheses(left)) ===
      normalizedTypeText(sourceText, unwrapTypeParentheses(right))
  )
}

/**
 * Whether a type can only describe an object: an array, tuple, function, mapped type, non-empty
 * literal, or an intersection of those.
 */
export function isDefinitelyObjectType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)

  return OBJECT_TYPES.has(unwrapped.type) || isCompositeObjectType(unwrapped)
}

/**
 * Whether a type says more than a broad record: a literal with a named member, or a `Record`
 * (possibly `Readonly`) whose value type is not `unknown` or `any`.
 */
export function isDefinitelyNarrowerRecordType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)
  if (unwrapped.type === "TSTypeLiteral") return hasNamedMember(unwrapped)

  return unwrapped.type === "TSTypeReference" && isNarrowerRecordReference(unwrapped)
}

// Types that are objects when their parts are.
function isCompositeObjectType(type: ESTree.TSType): boolean {
  switch (type.type) {
    case "TSIntersectionType":
      return type.types.every(isDefinitelyObjectType)
    case "TSTypeLiteral":
      return type.members.length > 0
    case "TSTypeOperator":
      return type.operator === "readonly" && isDefinitelyObjectType(type.typeAnnotation)
    default:
      return false
  }
}

function hasNamedMember(literal: ESTree.TSTypeLiteral): boolean {
  return literal.members.some((member) => member.type !== "TSIndexSignature")
}

function isNarrowerRecordReference(reference: ESTree.TSTypeReference): boolean {
  const name = typeReferenceName(reference)
  const [first, second] = reference.typeArguments?.params ?? []
  if (name === "Readonly") return first !== undefined && isDefinitelyNarrowerRecordType(first)

  return name === "Record" && second !== undefined && !isUnknownOrAnyType(second)
}

function unwrapTypeParentheses(type: ESTree.TSType): ESTree.TSType {
  let current = type

  while (current.type === "TSParenthesizedType") current = current.typeAnnotation

  return current
}

function isUnknownOrAnyType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)

  return unwrapped.type === "TSUnknownKeyword" || unwrapped.type === "TSAnyKeyword"
}

function isBroadRecordKeyType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)
  if (BROAD_KEY_KEYWORDS.has(unwrapped.type)) return true

  if (unwrapped.type === "TSUnionType") return unwrapped.types.every(isBroadRecordKeyType)

  return unwrapped.type === "TSTypeReference" && typeReferenceName(unwrapped) === "PropertyKey"
}

function isBroadRecordReference(reference: ESTree.TSTypeReference): boolean {
  const name = typeReferenceName(reference)
  const [key, value] = reference.typeArguments?.params ?? []
  if (name === "Readonly") return key !== undefined && isBroadRecordType(key)

  return (
    name === "Record" &&
    key !== undefined &&
    value !== undefined &&
    isBroadRecordKeyType(key) &&
    isUnknownOrAnyType(value)
  )
}

function isBroadIndexSignatureLiteral(literal: ESTree.TSTypeLiteral): boolean {
  const [member] = literal.members
  if (literal.members.length !== 1 || member?.type !== "TSIndexSignature") return false

  const [parameter] = member.parameters

  return (
    member.parameters.length === 1 &&
    parameter !== undefined &&
    isBroadRecordKeyType(parameter.typeAnnotation.typeAnnotation) &&
    isUnknownOrAnyType(member.typeAnnotation.typeAnnotation)
  )
}

function isBroadRecordType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)
  if (unwrapped.type === "TSTypeReference") return isBroadRecordReference(unwrapped)

  return unwrapped.type === "TSTypeLiteral" && isBroadIndexSignatureLiteral(unwrapped)
}

function normalizedTypeText(sourceText: string, type: ESTree.TSType): string {
  return sourceText.slice(type.start, type.end).replaceAll(/\s+/gu, "")
}
