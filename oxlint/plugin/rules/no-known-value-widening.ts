import { defineRule, type Rule } from "@oxlint/plugins"

import { enclosingFunction } from "./lib/ast/local-functions.ts"
import { ruleDocs } from "./lib/rule-meta.ts"
import { createTypeEnvironment } from "./lib/types/type-environment.ts"
import { callFlow } from "./lib/widening/call-flow.ts"
import {
  assertionFlow,
  assignmentFlow,
  declaratorFlow,
  propertyFlow,
  returnFlow,
  type FileState,
  type Flow,
} from "./lib/widening/widening-flows.ts"

export const noKnownValueWideningRule: Rule = defineRule({
  meta: {
    type: "problem",
    docs: ruleDocs(
      "no-known-value-widening",
      "Disallow annotations and assertions that widen a value whose type is already known."
    ),
    messages: {
      widening:
        "The {{target}} type on {{subject}} hides a type that is already known. Keep the inferred type or check it with `satisfies`.",
    },
  },

  createOnce(context) {
    const state: FileState = { environment: null }
    const flow: Flow = { context, state }

    return {
      AccessorProperty: (node) => propertyFlow(flow, node),
      AssignmentExpression: (node) => assignmentFlow(flow, node),
      CallExpression: (node) => callFlow(flow, node),
      PropertyDefinition: (node) => propertyFlow(flow, node),
      TSAsExpression: (node) => assertionFlow(flow, node),
      TSTypeAssertion: (node) => assertionFlow(flow, node),
      VariableDeclarator: (node) => declaratorFlow(flow, node),
      ArrowFunctionExpression(node) {
        if (node.body.type !== "BlockStatement") returnFlow(flow, node, node.body)
      },
      Program(node) {
        state.environment = createTypeEnvironment(node, context.sourceCode.visitorKeys)
      },
      ReturnStatement(node) {
        if (node.argument !== null) returnFlow(flow, enclosingFunction(node), node.argument)
      },
    }
  },
})
