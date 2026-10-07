import type { ESTree } from "@oxlint/plugins"

export type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion

/**
 * Whether a node is an `as` or angle-bracket type assertion.
 */
export function isTypeAssertion(node: ESTree.Node): node is TypeAssertion {
  return node.type === "TSAsExpression" || node.type === "TSTypeAssertion"
}

/**
 * Whether an assertion is `as const` or `<const>`.
 */
export function isConstAssertion(node: TypeAssertion): boolean {
  const { typeAnnotation } = node

  return (
    typeAnnotation.type === "TSTypeReference" &&
    typeAnnotation.typeName.type === "Identifier" &&
    typeAnnotation.typeName.name === "const"
  )
}
