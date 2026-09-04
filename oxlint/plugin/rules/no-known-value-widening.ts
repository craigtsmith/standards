import { defineRule } from "@oxlint/plugins"

import { callFlow } from "./lib/call-flow.ts"
import { createTypeEnvironment } from "./lib/dictionary-types.ts"
import { enclosingFunction } from "./lib/local-functions.ts"
import {
  assertionFlow,
  assignmentFlow,
  declaratorFlow,
  propertyFlow,
  returnFlow,
  type FileState,
  type Flow,
} from "./lib/widening-flows.ts"

export const noKnownValueWideningRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow syntactically established values from flowing into explicitly broad or anonymous target types that discard useful evidence.",
    },
    messages: {
      widening:
        "The explicit {{target}} type on {{subject}} discards known type evidence. Keep inference, validate with `satisfies`, or use a named owner contract.",
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
