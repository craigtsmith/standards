import type { ESTree } from "@oxlint/plugins"

import type { Flow } from "./widening-flows.ts"
import { functionParameterBindingName } from "../ast/function-parameters.ts"
import { functionName, hasUnknownAnnotation, predicateCall } from "../ast/local-functions.ts"
import { hasKnownCallArgumentEvidence } from "./known-evidence.ts"

/**
 * Reports a call that passes an argument of known type into a local type-predicate parameter
 * annotated `unknown`. Does nothing until the file's type environment exists.
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
