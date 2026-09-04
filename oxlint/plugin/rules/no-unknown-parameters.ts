import type { ESTree, SourceCode } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import {
  containsUnknownType,
  functionParameterBindingName,
  functionParameterTypeAnnotation,
  type FunctionParameter,
} from "./lib/function-parameters.ts"

interface UnparsedParameter {
  readonly name: string
  readonly type: ESTree.TSType
}

type ParameterOwner =
  | ESTree.ArrowFunctionExpression
  | ESTree.Function
  | ESTree.TSCallSignatureDeclaration
  | ESTree.TSConstructSignatureDeclaration
  | ESTree.TSConstructorType
  | ESTree.TSFunctionType
  | ESTree.TSMethodSignature

function isTypePredicateSubject(owner: ParameterOwner, parameterName: string): boolean {
  const predicate = owner.returnType?.typeAnnotation

  return (
    predicate?.type === "TSTypePredicate" &&
    predicate.parameterName.type === "Identifier" &&
    predicate.parameterName.name === parameterName
  )
}

function unparsedParameter(
  owner: ParameterOwner,
  parameter: FunctionParameter,
  sourceCode: SourceCode
): UnparsedParameter | null {
  const annotation = functionParameterTypeAnnotation(parameter)
  if (
    annotation === null ||
    annotation === undefined ||
    !containsUnknownType(annotation.typeAnnotation)
  ) {
    return null
  }

  const name = functionParameterBindingName(parameter, sourceCode)

  return name === "cause" || isTypePredicateSubject(owner, name)
    ? null
    : { name, type: annotation.typeAnnotation }
}

export const noUnknownParametersRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow explicitly unknown function parameters except `cause` and type-predicate subjects; decode unknown input at its I/O boundary instead.",
    },
    messages: {
      unknownParameter:
        "Parameter `{{parameter}}` leaves input unparsed. Accept a named domain type; run the expected schema or parser at the I/O boundary before calling this function.",
    },
  },

  createOnce(context) {
    const checkParameters = (node: ParameterOwner) => {
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
    }
  },
})
