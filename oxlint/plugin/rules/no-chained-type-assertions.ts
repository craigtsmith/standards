import type { ESTree, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { isConstAssertion, isTypeAssertion, type TypeAssertion } from "./lib/ast/assertions.ts"
import { unwrapExpressionParentheses } from "./lib/ast/expressions.ts"
import { ruleDocs } from "./lib/rule-meta.ts"

function isOutermostAssertionInChain(node: TypeAssertion): boolean {
  let current: ESTree.Expression = node
  let parent = node.parent

  while (parent.type === "ParenthesizedExpression" && parent.expression === current) {
    current = parent
    parent = parent.parent
  }

  return !isTypeAssertion(parent) || parent.expression !== current
}

function isForbiddenAssertionChain(node: TypeAssertion): boolean {
  let assertionCount = 0
  let hasNonConstAssertion = false
  let current: ESTree.Expression = node

  while (isTypeAssertion(current)) {
    assertionCount += 1
    hasNonConstAssertion ||= !isConstAssertion(current)
    current = unwrapExpressionParentheses(current.expression)
  }

  return assertionCount > 1 && hasNonConstAssertion
}

export const noChainedTypeAssertionsRule: Rule = defineRule({
  meta: {
    type: "problem",
    docs: ruleDocs(
      "no-chained-type-assertions",
      "Disallow chaining type assertions, such as `value as unknown as T`."
    ),
    messages: {
      chained:
        "This chain of type assertions hides the original type from the type checker. Keep the precise type or parse the input first.",
    },
  },

  createOnce(context) {
    const checkTypeAssertion = (node: TypeAssertion) => {
      if (!isOutermostAssertionInChain(node) || !isForbiddenAssertionChain(node)) return

      context.report({ messageId: "chained", node })
    }

    return { TSAsExpression: checkTypeAssertion, TSTypeAssertion: checkTypeAssertion }
  },
})
