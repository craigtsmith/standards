import type { ESTree } from "@oxlint/plugins"

import type { Flow } from "./widening-flows.ts"
import { functionParameterBindingName } from "./function-parameters.ts"
import { hasKnownCallArgumentEvidence } from "./known-evidence.ts"
import { functionName, hasUnknownAnnotation, predicateCall } from "./local-functions.ts"

/**
 * Reports a call that passes an argument with known type evidence into a local type-predicate
 * parameter annotated `unknown`, since the call widens what is already known.
 *
 * @param flow - The rule's flow state and context; does nothing when no type environment exists.
 * @param node - The call expression to check.
 */
export function callFlow(flow: Flow, node: ESTree.CallExpression): void {
  const { environment } = flow.state
  if (environment === null) return

  const { sourceCode } = flow.context
  const call = predicateCall(sourceCode, node)
  if (call === null || !hasUnknownAnnotation(call.parameter)) return

  if (!hasKnownCallArgumentEvidence({ environment, sourceCode }, call.argument)) return

  flow.context.report({
    messageId: "widening",
    node: call.argument,
    data: {
      subject: `argument for parameter \`${functionParameterBindingName(call.parameter, sourceCode)}\` of \`${functionName(sourceCode, call.owner)}\``,
      target: "unknown",
    },
  })
}
