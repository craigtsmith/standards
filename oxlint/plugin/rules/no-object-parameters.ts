import type { Context, ESTree, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import {
  functionParameterBindingName,
  functionParameterTypeAnnotation,
} from "./lib/ast/function-parameters.ts"
import { signatureVisitor, type SignatureNode } from "./lib/ast/signatures.ts"
import { ruleDocs } from "./lib/rule-meta.ts"
import {
  createTypeAliasEnvironment,
  resolvedTypeMatches,
  type ResolvedTypeMatcher,
  type TypeAliasEnvironment,
} from "./lib/types/type-alias-resolution.ts"

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

function reportObjectParameters(context: Context, state: FileState, node: SignatureNode): void {
  for (const parameter of node.params) {
    const annotation = functionParameterTypeAnnotation(parameter)
    if (annotation === null || !resolvesToObject(annotation.typeAnnotation, state.environment)) {
      continue
    }

    context.report({
      data: { parameter: functionParameterBindingName(parameter, context.sourceCode) },
      messageId: "objectParameter",
      node: annotation.typeAnnotation,
    })
  }
}

export const noObjectParametersRule: Rule = defineRule({
  meta: {
    docs: ruleDocs("no-object-parameters", "Disallow parameters typed as `object`."),
    type: "problem",
    messages: {
      objectParameter:
        "Parameter `{{parameter}}` has the broad `object` type. Use a named type and parse external input before the call.",
    },
  },

  createOnce(context) {
    const state: FileState = { environment: null }

    return {
      ...signatureVisitor((node) => reportObjectParameters(context, state, node)),

      Program(node) {
        state.environment = createTypeAliasEnvironment(node, context.sourceCode.visitorKeys)
      },
    }
  },
})
