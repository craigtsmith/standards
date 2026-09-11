import type { Context, ESTree } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import {
  functionParameterBindingName,
  functionParameterTypeAnnotation,
} from "./lib/ast/function-parameters.ts"
import {
  createTypeAliasEnvironment,
  resolvedTypeMatches,
  type ResolvedTypeMatcher,
  type TypeAliasEnvironment,
} from "./lib/types/type-alias-resolution.ts"

type ParameterOwner =
  | ESTree.ArrowFunctionExpression
  | ESTree.Function
  | ESTree.TSCallSignatureDeclaration
  | ESTree.TSConstructSignatureDeclaration
  | ESTree.TSConstructorType
  | ESTree.TSFunctionType
  | ESTree.TSMethodSignature

const isObjectKeyword: ResolvedTypeMatcher = (resolved, matches) => {
  if (resolved.type === "TSObjectKeyword") return true

  if (resolved.type === "TSParenthesizedType") return matches(resolved.typeAnnotation)

  return resolved.type === "TSUnionType" && resolved.types.some(matches)
}

interface FileState {
  environment: TypeAliasEnvironment | null
}

function resolvesToObject(type: ESTree.TSType, environment: TypeAliasEnvironment | null): boolean {
  return environment !== null && resolvedTypeMatches(type, environment, isObjectKeyword)
}

function reportObjectParameters(context: Context, state: FileState, node: ParameterOwner): void {
  for (const parameter of node.params) {
    const annotation = functionParameterTypeAnnotation(parameter)
    if (
      annotation === null ||
      annotation === undefined ||
      !resolvesToObject(annotation.typeAnnotation, state.environment)
    ) {
      continue
    }

    context.report({
      data: { parameter: functionParameterBindingName(parameter, context.sourceCode) },
      messageId: "objectParameter",
      node: annotation.typeAnnotation,
    })
  }
}

export const noObjectParametersRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow object function parameters; inputs must use an owner-provided type and be parsed at their boundary.",
    },
    messages: {
      objectParameter:
        "Parameter `{{parameter}}` uses the broad `object` type. Accept a named owner type; parse external input at its boundary before calling this function.",
    },
  },

  createOnce(context) {
    const state: FileState = { environment: null }
    const checkParameters = (node: ParameterOwner) => reportObjectParameters(context, state, node)

    return {
      ArrowFunctionExpression: checkParameters,
      FunctionDeclaration: checkParameters,
      FunctionExpression: checkParameters,
      TSCallSignatureDeclaration: checkParameters,
      TSConstructorType: checkParameters,
      TSConstructSignatureDeclaration: checkParameters,
      TSDeclareFunction: checkParameters,
      TSEmptyBodyFunctionExpression: checkParameters,
      TSFunctionType: checkParameters,
      TSMethodSignature: checkParameters,

      Program(node) {
        state.environment = createTypeAliasEnvironment(node, context.sourceCode.visitorKeys)
      },
    }
  },
})
