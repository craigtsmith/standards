import { defineRule, type Rule } from "@oxlint/plugins"

import { isGlobalReflectMethodCall } from "./lib/ast/reflect-method.ts"
import { ruleDocs } from "./lib/rule-meta.ts"

export const noReflectApplyRule: Rule = defineRule({
  meta: {
    docs: ruleDocs("no-reflect-apply", "Disallow `Reflect.apply`."),
    type: "problem",
    messages: {
      reflectApply:
        "`Reflect.apply` can return `any`, which turns off type checking. Call the function directly.",
    },
  },

  createOnce(context) {
    return {
      CallExpression(node) {
        if (isGlobalReflectMethodCall(context.sourceCode, node.callee, "apply")) {
          context.report({ messageId: "reflectApply", node })
        }
      },
    }
  },
})
