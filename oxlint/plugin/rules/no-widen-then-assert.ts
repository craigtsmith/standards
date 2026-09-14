import type { ESTree, Rule, Scope, Variable } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

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
  resolvedVariableForIdentifier,
  stableConstDeclarator,
  type KnownValueEvidence,
} from "./lib/widening/widened-bindings.ts"

interface WidenedBinding {
  readonly boundary: ESTree.Node | null
  readonly broadKind: BroadTypeKind
  readonly declaredAt: number
  readonly evidence: KnownValueEvidence
}

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion

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

function widenedBinding(variable: Variable, scopes: readonly Scope[]): WidenedBinding | null {
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
    { boundary, scopes },
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
    docs: {
      description:
        "Disallow local const flows that explicitly widen a known value before asserting the widened binding to a narrower type.",
    },
    messages: {
      widenThenAssert:
        'Binding "{{name}}" discards type evidence and later recreates it with an assertion. Keep the precise type from initialization through use; parse boundary input once.',
    },
  },

  createOnce(context) {
    let scopes: readonly Scope[] = []

    const checkAssertion = (node: TypeAssertion) => {
      const expression = assertedExpression(node)
      if (expression.type !== "Identifier") return

      const variable = resolvedVariableForIdentifier(scopes, expression)
      const widened = variable === null ? null : widenedBinding(variable, scopes)
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

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,

      Program() {
        scopes = context.sourceCode.scopeManager.scopes
      },
    }
  },
})
