import type { ESTree } from "@oxlint/plugins"

import { isUnknownOrAnyType, typeReferenceName, unwrapTypeParentheses } from "./type-syntax.ts"

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

function normalizedTypeText(sourceText: string, type: ESTree.TSType): string {
  return sourceText.slice(type.start, type.end).replaceAll(/\s+/gu, "")
}
