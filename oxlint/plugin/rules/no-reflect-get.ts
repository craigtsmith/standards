import { defineRule, type Rule } from "@oxlint/plugins"

import { isGlobalReflectMethodCall } from "./lib/ast/reflect-method.ts"
import { ruleDocs } from "./lib/rule-meta.ts"

export const noReflectGetRule: Rule = defineRule({
  meta: {
    docs: ruleDocs("no-reflect-get", "Disallow `Reflect.get`."),
    type: "problem",
    messages: {
      reflectGet:
        "`Reflect.get` can return `any`, which turns off type checking. Use property access.",
    },
  },

  createOnce(context) {
    return {
      CallExpression(node) {
        if (isGlobalReflectMethodCall(context.sourceCode, node.callee, "get")) {
          context.report({ messageId: "reflectGet", node })
        }
      },
    }
  },
})
