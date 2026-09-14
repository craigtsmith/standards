import type { ESTree, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { enclosingFunction } from "./lib/ast/local-functions.ts"
import { ruleDocs, ruleOption } from "./lib/rule-meta.ts"

function isInsideTypeGuard(node: ESTree.Node): boolean {
  return enclosingFunction(node)?.returnType?.typeAnnotation.type === "TSTypePredicate"
}

function isExistenceProbe(node: ESTree.UnaryExpression): boolean {
  const parent = node.parent
  if (parent.type !== "BinaryExpression") return false

  if (!["===", "!==", "==", "!="].includes(parent.operator)) return false

  const other = parent.left === node ? parent.right : parent.left

  return other.type === "Literal" && other.value === "undefined"
}

export const noRuntimeTypeofRule: Rule = defineRule({
  meta: {
    defaultOptions: [{ allowInTypeGuards: false }],
    type: "problem",
    docs: ruleDocs(
      "no-runtime-typeof",
      'Disallow `typeof` checks on values, apart from `typeof x === "undefined"`.'
    ),
    messages: {
      runtimeTypeof:
        "This `typeof` check inspects a value that was never parsed. Parse the input at its boundary first.",
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
        if (
          node.operator === "typeof" &&
          !isExistenceProbe(node) &&
          (ruleOption(context, "allowInTypeGuards") !== true || !isInsideTypeGuard(node))
        ) {
          context.report({ messageId: "runtimeTypeof", node })
        }
      },
    }
  },
})
