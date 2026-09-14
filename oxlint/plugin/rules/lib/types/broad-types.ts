import type { ESTree } from "@oxlint/plugins"

import {
  BROAD_KEY_KEYWORDS,
  isUnknownOrAnyType,
  typeReferenceName,
  unwrapTypeParentheses,
} from "./type-syntax.ts"

export type BroadTypeKind = "object" | "record" | "top"

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
