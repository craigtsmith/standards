import type { ESTree, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import {
  createTypeAliasEnvironment,
  resolvedTypeMatches,
  type ResolvedTypeMatcher,
  type TypeAliasEnvironment,
} from "./lib/types/type-alias-resolution.ts"

type FunctionWithReturnType =
  | ESTree.ArrowFunctionExpression
  | ESTree.Function
  | ESTree.TSCallSignatureDeclaration
  | ESTree.TSConstructSignatureDeclaration
  | ESTree.TSConstructorType
  | ESTree.TSFunctionType
  | ESTree.TSMethodSignature

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
    docs: {
      description:
        "Disallow functions whose explicit return contract is unknown or Promise<unknown>.",
    },
    messages: {
      unknownReturn:
        "This function exposes `unknown` to its caller. Parse the value at its boundary and return a named domain type.",
    },
  },

  createOnce(context) {
    let environment: TypeAliasEnvironment | null = null

    const checkReturnType = (node: FunctionWithReturnType) => {
      const annotation = node.returnType
      if (annotation === null || annotation === undefined) return

      if (!resolvesToUnknown(annotation.typeAnnotation, environment)) return

      context.report({ messageId: "unknownReturn", node: annotation.typeAnnotation })
    }

    return {
      ArrowFunctionExpression: checkReturnType,
      FunctionDeclaration: checkReturnType,
      FunctionExpression: checkReturnType,
      TSCallSignatureDeclaration: checkReturnType,
      TSConstructorType: checkReturnType,
      TSConstructSignatureDeclaration: checkReturnType,
      TSDeclareFunction: checkReturnType,
      TSEmptyBodyFunctionExpression: checkReturnType,
      TSFunctionType: checkReturnType,
      TSMethodSignature: checkReturnType,

      Program(node) {
        environment = createTypeAliasEnvironment(node, context.sourceCode.visitorKeys)
      },
    }
  },
})
