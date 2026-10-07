import type { ESTree, Rule, SourceCode, Variable } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import type { TypeAssertion } from "./lib/ast/assertions.ts"
import { resolveVariable, stableConstDeclarator } from "./lib/ast/variables.ts"
import { ruleDocs } from "./lib/rule-meta.ts"
import {
  broadTypeKind,
  isDefinitelyNarrowerRecordType,
  isDefinitelyObjectType,
  typesHaveSameSyntax,
  type BroadTypeKind,
} from "./lib/types/broad-types.ts"
import {
  assertedExpression,
  assertionFromExpression,
  functionBoundary,
  knownValueEvidence,
  type KnownValueEvidence,
} from "./lib/widening/widened-bindings.ts"

interface WidenedBinding {
  readonly boundary: ESTree.Node | null
  readonly broadKind: BroadTypeKind
  readonly declaredAt: number
  readonly evidence: KnownValueEvidence
}

function broadBindingKind(
  declaredType: ESTree.TSType | null,
  assertion: TypeAssertion | null
): BroadTypeKind | null {
  const declaredKind = declaredType === null ? null : broadTypeKind(declaredType)

  return declaredKind ?? (assertion === null ? null : broadTypeKind(assertion.typeAnnotation))
}

function widenedInitializer(
  initializer: ESTree.Expression,
  assertion: TypeAssertion | null
): ESTree.Expression {
  return assertion !== null && broadTypeKind(assertion.typeAnnotation) !== null
    ? assertedExpression(assertion)
    : initializer
}

function widenedBinding(variable: Variable, sourceCode: SourceCode): WidenedBinding | null {
  const declarator = stableConstDeclarator(variable)
  if (declarator === null || declarator.id.type !== "Identifier" || declarator.init === null) {
    return null
  }

  const assertion = assertionFromExpression(declarator.init)
  const broadKind = broadBindingKind(
    declarator.id.typeAnnotation?.typeAnnotation ?? null,
    assertion
  )
  if (broadKind === null) return null

  const boundary = functionBoundary(declarator)
  const evidence = knownValueEvidence(
    widenedInitializer(declarator.init, assertion),
    { boundary, sourceCode },
    new Set([variable])
  )

  return evidence === null ? null : { boundary, broadKind, declaredAt: declarator.end, evidence }
}

function assertionIsNarrower(
  sourceText: string,
  widened: WidenedBinding,
  assertedType: ESTree.TSType
): boolean {
  if (broadTypeKind(assertedType) !== null) return false

  if (widened.broadKind === "top") return true

  if (typesHaveSameSyntax(sourceText, widened.evidence.type, assertedType)) return true

  if (widened.broadKind === "object") return isDefinitelyObjectType(assertedType)

  return isDefinitelyNarrowerRecordType(assertedType)
}

export const noWidenThenAssertRule: Rule = defineRule({
  meta: {
    type: "problem",
    docs: ruleDocs(
      "no-widen-then-assert",
      "Disallow widening a known value and then asserting it back to a narrower type."
    ),
    messages: {
      widenThenAssert:
        'Binding "{{name}}" is widened and later asserted back to a narrower type. Keep the precise type from the start.',
    },
  },

  createOnce(context) {
    const checkAssertion = (node: TypeAssertion) => {
      const expression = assertedExpression(node)
      if (expression.type !== "Identifier") return

      const variable = resolveVariable(context.sourceCode, expression)
      const widened = variable === null ? null : widenedBinding(variable, context.sourceCode)
      if (
        widened === null ||
        node.start <= widened.declaredAt ||
        functionBoundary(node) !== widened.boundary ||
        !assertionIsNarrower(context.sourceCode.text, widened, node.typeAnnotation)
      ) {
        return
      }

      context.report({ data: { name: expression.name }, messageId: "widenThenAssert", node })
    }

    return { TSAsExpression: checkAssertion, TSTypeAssertion: checkAssertion }
  },
})
