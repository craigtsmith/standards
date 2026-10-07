import type { ESTree, Rule, SourceCode } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import {
  containsUnknownType,
  functionParameterBindingName,
  functionParameterTypeAnnotation,
  type FunctionParameter,
} from "./lib/ast/function-parameters.ts"
import { signatureVisitor, type SignatureNode } from "./lib/ast/signatures.ts"
import { ruleDocs } from "./lib/rule-meta.ts"

interface UnparsedParameter {
  readonly name: string
  readonly type: ESTree.TSType
}

function isTypePredicateSubject(owner: SignatureNode, parameterName: string): boolean {
  const predicate = owner.returnType?.typeAnnotation

  return (
    predicate?.type === "TSTypePredicate" &&
    predicate.parameterName.type === "Identifier" &&
    predicate.parameterName.name === parameterName
  )
}

function unparsedParameter(
  owner: SignatureNode,
  parameter: FunctionParameter,
  sourceCode: SourceCode
): UnparsedParameter | null {
  const annotation = functionParameterTypeAnnotation(parameter)
  if (annotation === null || !containsUnknownType(annotation.typeAnnotation)) return null

  const name = functionParameterBindingName(parameter, sourceCode)

  return name === "cause" || isTypePredicateSubject(owner, name)
    ? null
    : { name, type: annotation.typeAnnotation }
}

export const noUnknownParametersRule: Rule = defineRule({
  meta: {
    type: "problem",
    docs: ruleDocs(
      "no-unknown-parameters",
      "Disallow parameters typed as `unknown`, except `cause` and type-predicate subjects."
    ),
    messages: {
      unknownParameter:
        "Parameter `{{parameter}}` accepts `unknown`. Use a named type and parse the input before the call.",
    },
  },

  createOnce(context) {
    const checkParameters = (node: SignatureNode) => {
      for (const parameter of node.params) {
        const unparsed = unparsedParameter(node, parameter, context.sourceCode)
        if (unparsed === null) continue

        context.report({
          data: { parameter: unparsed.name },
          messageId: "unknownParameter",
          node: unparsed.type,
        })
      }
    }

    return signatureVisitor(checkParameters)
  },
})
