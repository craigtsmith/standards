import type { ESTree, Options, Rule, SourceCode } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import {
  containsUnknownType,
  functionParameterBindingName,
  functionParameterTypeAnnotation,
  type FunctionParameter,
} from "./lib/ast/function-parameters.ts"
import { signatureVisitor, type SignatureNode } from "./lib/ast/signatures.ts"
import { ruleDocs, ruleOption } from "./lib/rule-meta.ts"

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

// The schema and default guarantee a list of non-empty strings.
function configuredNames(value: Options[number] | undefined): ReadonlySet<string> {
  if (!Array.isArray(value)) return new Set()

  return new Set(value.flatMap((name) => (name instanceof Object ? [] : [String(name)])))
}

function unparsedParameter(
  parameter: FunctionParameter,
  sourceCode: SourceCode
): UnparsedParameter | null {
  const annotation = functionParameterTypeAnnotation(parameter)
  if (annotation === null || !containsUnknownType(annotation.typeAnnotation)) return null

  return {
    name: functionParameterBindingName(parameter, sourceCode),
    type: annotation.typeAnnotation,
  }
}

export const noUnknownParametersRule: Rule = defineRule({
  meta: {
    defaultOptions: [{ allowNames: ["cause"] }],
    type: "problem",
    docs: ruleDocs(
      "no-unknown-parameters",
      "Disallow parameters typed as `unknown`, except allowed names and type-predicate subjects."
    ),
    messages: {
      unknownParameter:
        "Parameter `{{parameter}}` accepts `unknown`. Use a named type and parse the input before the call.",
    },
    schema: [
      {
        additionalProperties: false,
        type: "object",
        properties: {
          allowNames: {
            items: { minLength: 1, type: "string" },
            type: "array",
            uniqueItems: true,
          },
        },
      },
    ],
  },

  createOnce(context) {
    // Set per file by `Program`, which is visited before any function.
    let allowNames: ReadonlySet<string> = new Set()

    const checkParameter = (owner: SignatureNode, parameter: FunctionParameter) => {
      const unparsed = unparsedParameter(parameter, context.sourceCode)
      if (unparsed === null || allowNames.has(unparsed.name)) return

      if (isTypePredicateSubject(owner, unparsed.name)) return

      context.report({
        data: { parameter: unparsed.name },
        messageId: "unknownParameter",
        node: unparsed.type,
      })
    }

    return {
      ...signatureVisitor((node) => {
        for (const parameter of node.params) checkParameter(node, parameter)
      }),

      Program() {
        allowNames = configuredNames(ruleOption(context, "allowNames"))
      },
    }
  },
})
