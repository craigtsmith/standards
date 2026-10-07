import type { ESTree, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { signatureVisitor, type SignatureNode } from "./lib/ast/signatures.ts"
import { ruleDocs } from "./lib/rule-meta.ts"
import {
  createTypeAliasEnvironment,
  resolvedTypeMatches,
  type ResolvedTypeMatcher,
  type TypeAliasEnvironment,
} from "./lib/types/type-alias-resolution.ts"

function isPromiseReference(type: ESTree.TSType): type is ESTree.TSTypeReference {
  return (
    type.type === "TSTypeReference" &&
    type.typeName.type === "Identifier" &&
    (type.typeName.name === "Promise" || type.typeName.name === "PromiseLike")
  )
}

const isUnknownKeyword: ResolvedTypeMatcher = (resolved, matches) => {
  if (resolved.type === "TSUnknownKeyword") return true

  if (resolved.type === "TSParenthesizedType") return matches(resolved.typeAnnotation)

  if (resolved.type === "TSUnionType") return resolved.types.some(matches)

  if (!isPromiseReference(resolved)) return false

  const value = resolved.typeArguments?.params[0]

  return value !== undefined && matches(value)
}

function resolvesToUnknown(type: ESTree.TSType, environment: TypeAliasEnvironment | null): boolean {
  return environment !== null && resolvedTypeMatches(type, environment, isUnknownKeyword)
}

export const noUnknownReturnsRule: Rule = defineRule({
  meta: {
    type: "problem",
    docs: ruleDocs(
      "no-unknown-returns",
      "Disallow return types of `unknown` or `Promise<unknown>`."
    ),
    messages: {
      unknownReturn: "This function returns `unknown`. Parse the value and return a named type.",
    },
  },

  createOnce(context) {
    let environment: TypeAliasEnvironment | null = null

    const checkReturnType = (node: SignatureNode) => {
      const returnType = node.returnType?.typeAnnotation
      if (returnType === undefined || !resolvesToUnknown(returnType, environment)) return

      context.report({ messageId: "unknownReturn", node: returnType })
    }

    return {
      ...signatureVisitor(checkReturnType),

      Program(node) {
        environment = createTypeAliasEnvironment(node, context.sourceCode.visitorKeys)
      },
    }
  },
})
