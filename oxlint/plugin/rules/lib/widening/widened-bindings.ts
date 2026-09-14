import type { ESTree, SourceCode, Variable } from "@oxlint/plugins"

import { isTypeAssertion, type TypeAssertion } from "../ast/assertions.ts"
import { unwrapExpressionParentheses } from "../ast/expressions.ts"
import { isFunctionExpression, type FunctionExpression } from "../ast/local-functions.ts"
import { resolveVariable, stableConstDeclarator } from "../ast/variables.ts"
import { broadTypeKind } from "../types/broad-types.ts"
import { SHAPED_VALUES } from "./syntactic-values.ts"

export interface KnownValueEvidence {
  readonly type: ESTree.TSType | null
}

export interface ValueFlow {
  readonly boundary: ESTree.Node | null
  readonly sourceCode: SourceCode
}

/**
 * The expression an assertion applies to, without parentheses.
 */
export function assertedExpression(node: TypeAssertion): ESTree.Expression {
  return unwrapExpressionParentheses(node.expression)
}

/**
 * The assertion an expression is once parentheses are removed, or null when it is not one.
 */
export function assertionFromExpression(expression: ESTree.Expression): TypeAssertion | null {
  const unwrapped = unwrapExpressionParentheses(expression)

  return isTypeAssertion(unwrapped) ? unwrapped : null
}

/**
 * The nearest function of any form strictly above a node, bodiless signatures included, or null at
 * module level. `enclosingFunction` skips bodiless signatures and counts the node itself.
 */
export function functionBoundary(node: ESTree.Node): FunctionExpression | null {
  let current = node.parent

  while (current !== null && current.type !== "Program") {
    if (isFunctionExpression(current)) return current

    current = current.parent
  }

  return null
}

/**
 * What an expression's value is already known to be: a narrow asserted type, a syntactic literal,
 * or the annotation or initialiser of a stable `const` declared inside the same function. A
 * syntactic value has a null `type`.
 */
export function knownValueEvidence(
  expression: ESTree.Expression,
  flow: ValueFlow,
  visitedVariables: ReadonlySet<Variable>
): KnownValueEvidence | null {
  const unwrapped = unwrapExpressionParentheses(expression)
  if (isTypeAssertion(unwrapped)) return assertionEvidence(unwrapped.typeAnnotation)

  if (SHAPED_VALUES.has(unwrapped.type)) return { type: null }

  return unwrapped.type === "Identifier"
    ? identifierEvidence(unwrapped, flow, visitedVariables)
    : null
}

function assertionEvidence(type: ESTree.TSType): KnownValueEvidence | null {
  return broadTypeKind(type) === null ? { type } : null
}

function annotationEvidence(
  identifier: ESTree.Node,
  annotation: ESTree.TSType,
  boundary: ESTree.Node | null
): KnownValueEvidence | null {
  return functionBoundary(identifier) !== boundary || broadTypeKind(annotation) !== null
    ? null
    : { type: annotation }
}

function identifierEvidence(
  identifier: ESTree.IdentifierReference,
  flow: ValueFlow,
  visitedVariables: ReadonlySet<Variable>
): KnownValueEvidence | null {
  const variable = resolveVariable(flow.sourceCode, identifier)

  return variable === null || visitedVariables.has(variable)
    ? null
    : variableEvidence(variable, flow, visitedVariables)
}

function variableEvidence(
  variable: Variable,
  flow: ValueFlow,
  visitedVariables: ReadonlySet<Variable>
): KnownValueEvidence | null {
  const annotated = variable.identifiers.find(
    (identifier) => identifier.typeAnnotation?.typeAnnotation !== undefined
  )
  const annotation = annotated?.typeAnnotation?.typeAnnotation
  if (annotated !== undefined && annotation !== undefined) {
    return annotationEvidence(annotated, annotation, flow.boundary)
  }

  const declarator = stableConstDeclarator(variable)
  if (
    declarator === null ||
    declarator.init === null ||
    functionBoundary(declarator) !== flow.boundary
  ) {
    return null
  }

  return knownValueEvidence(declarator.init, flow, new Set([...visitedVariables, variable]))
}
