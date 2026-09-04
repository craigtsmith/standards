import type { ESTree, Options } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

type RuntimeFunction = ESTree.ArrowFunctionExpression | ESTree.Function

function isRuntimeFunction(node: ESTree.Node): node is RuntimeFunction {
  return (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression"
  )
}

function isInsideTypeGuard(node: ESTree.Node): boolean {
  let current: ESTree.Node = node

  while (current.type !== "Program") {
    if (isRuntimeFunction(current)) {
      return current.returnType?.typeAnnotation.type === "TSTypePredicate"
    }

    current = current.parent
  }

  return false
}

function isExistenceProbe(node: ESTree.UnaryExpression): boolean {
  const parent = node.parent
  if (parent.type !== "BinaryExpression") return false

  if (!["===", "!==", "==", "!="].includes(parent.operator)) return false

  const other = parent.left === node ? parent.right : parent.left

  return other.type === "Literal" && other.value === "undefined"
}

function allowsTypeGuards(option: Options[number] | undefined): boolean {
  return option instanceof Object && !Array.isArray(option) && option.allowInTypeGuards === true
}

export const noRuntimeTypeofRule = defineRule({
  meta: {
    defaultOptions: [{ allowInTypeGuards: false }],
    type: "problem",
    docs: {
      description:
        "Disallow runtime typeof checks; external values must be decoded into meaningful types at their I/O boundary.",
    },
    messages: {
      runtimeTypeof:
        "A `typeof` check narrows a representation without establishing its contract. Parse input at its I/O boundary, then branch on the domain value.",
    },
    schema: [
      {
        additionalProperties: false,
        properties: { allowInTypeGuards: { type: "boolean" } },
        type: "object",
      },
    ],
  },

  createOnce(context) {
    return {
      UnaryExpression(node) {
        const allowInTypeGuards = allowsTypeGuards(context.options[0])
        if (
          node.operator === "typeof" &&
          !isExistenceProbe(node) &&
          (!allowInTypeGuards || !isInsideTypeGuard(node))
        ) {
          context.report({ messageId: "runtimeTypeof", node })
        }
      },
    }
  },
})
