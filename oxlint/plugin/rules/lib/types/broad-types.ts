import type { ESTree } from "@oxlint/plugins"

import { typeReferenceName } from "./type-syntax.ts"

export type BroadTypeKind = "object" | "record" | "top"

// Key types that admit any property name.
export const BROAD_KEY_KEYWORDS: ReadonlySet<string> = new Set([
  "TSNumberKeyword",
  "TSStringKeyword",
  "TSSymbolKeyword",
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

  switch (unwrapped.type) {
    case "TSArrayType":
    case "TSConstructorType":
    case "TSFunctionType":
    case "TSMappedType":
    case "TSObjectKeyword":
    case "TSTupleType":
      return true
    case "TSTypeLiteral":
      return unwrapped.members.length > 0
    case "TSIntersectionType":
      return unwrapped.types.every(isDefinitelyObjectType)
    case "TSTypeOperator":
      return unwrapped.operator === "readonly" && isDefinitelyObjectType(unwrapped.typeAnnotation)
    default:
      return false
  }
}

/**
 * Whether a type says more than a broad record: a literal with a named member, or a `Record`
 * (possibly `Readonly`) whose value type is not `unknown` or `any`.
 */
export function isDefinitelyNarrowerRecordType(type: ESTree.TSType): boolean {
  const unwrapped = unwrapTypeParentheses(type)
  if (unwrapped.type === "TSTypeLiteral") {
    return unwrapped.members.some((member) => member.type !== "TSIndexSignature")
  }

  if (unwrapped.type !== "TSTypeReference") return false

  const name = typeReferenceName(unwrapped)
  const [first, second] = unwrapped.typeArguments?.params ?? []
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
