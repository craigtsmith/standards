import type { ESTree, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { unwrapExpressionParentheses } from "./lib/ast/expressions.ts"
import { ruleDocs } from "./lib/rule-meta.ts"

// A literal `{}` only: an asserted `{} as T` is left alone.
function isBareEmptyObject(node: ESTree.Expression): boolean {
  return node.type === "ObjectExpression" && node.properties.length === 0
}

function isConditionalEmptyObjectSpread(node: ESTree.Expression): boolean {
  const conditional = unwrapExpressionParentheses(node)

  return (
    conditional.type === "ConditionalExpression" &&
    (isBareEmptyObject(conditional.consequent) || isBareEmptyObject(conditional.alternate))
  )
}

export const noConditionalEmptyObjectSpreadRule: Rule = defineRule({
  meta: {
    type: "suggestion",
    docs: ruleDocs(
      "no-conditional-empty-object-spread",
      "Disallow spreading a conditional that yields an empty object to omit a property."
    ),
    messages: {
      avoid:
        "This spread omits a property by spreading an empty object. Add the property in a separate `if` statement.",
    },
  },

  createOnce(context) {
    return {
      SpreadElement(node) {
        if (node.parent.type !== "ObjectExpression") return

        if (isConditionalEmptyObjectSpread(node.argument)) {
          context.report({ messageId: "avoid", node })
        }
      },
    }
  },
})
