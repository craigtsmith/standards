import type { ESTree, Scope, Variable } from "@oxlint/plugins"

import { unwrapExpressionParentheses } from "../ast/expressions.ts"
import { variableDeclarator } from "../ast/variables.ts"
import { broadTypeKind } from "../types/broad-types.ts"

export interface KnownValueEvidence {
  readonly type: ESTree.TSType | null
}

export interface ValueFlow {
  readonly boundary: ESTree.Node | null
  readonly scopes: readonly Scope[]
}

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion

const functionBoundaryTypes = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
  "TSDeclareFunction",
  "TSEmptyBodyFunctionExpression",
])

const SYNTACTIC_VALUES = new Set([
  "ArrayExpression",
  "ArrowFunctionExpression",
  "ClassExpression",
  "FunctionExpression",
  "Literal",
  "NewExpression",
  "ObjectExpression",
  "TemplateLiteral",
])

/**
 * Gives the expression a type assertion applies to, with any parentheses removed.
 *
 * @param node - The `as` or angle-bracket assertion.
 * @returns The asserted expression.
 */
export function assertedExpression(node: TypeAssertion): ESTree.Expression {
  return unwrapExpressionParentheses(node.expression)
}

/**
 * Finds the type assertion an expression is, once parentheses are removed.
 *
 * @param expression - The expression to inspect.
 * @returns The `as` or angle-bracket assertion, or null when the expression is
 * not one.
 */
export function assertionFromExpression(expression: ESTree.Expression): TypeAssertion | null {
  const unwrapped = unwrapExpressionParentheses(expression)

  return unwrapped.type === "TSAsExpression" || unwrapped.type === "TSTypeAssertion"
    ? unwrapped
    : null
}

/**
 * Finds the nearest function of any form that encloses a node.
 *
 * @param node - The node to start from; the node itself is not considered.
 * @returns The enclosing function, or null when the node sits at module level.
 */
export function functionBoundary(node: ESTree.Node): ESTree.Node | null {
  let current = node.parent

  while (current !== null && current.type !== "Program") {
    if (functionBoundaryTypes.has(current.type)) return current

    current = current.parent
  }

  return null
}

/**
 * Finds the variable an identifier resolves to by matching its position against the references of
 * the given scopes.
 *
 * @param scopes - The scopes whose references are searched.
 * @param identifier - The identifier reference to resolve.
 * @returns The resolved variable, or null when no scope holds a reference at
 * that position.
 */
export function resolvedVariableForIdentifier(
  scopes: readonly Scope[],
  identifier: ESTree.IdentifierReference
): Variable | null {
  for (const scope of scopes) {
    const reference = scope.references.find(
      (candidate) =>
        candidate.identifier.start === identifier.start &&
        candidate.identifier.end === identifier.end
    )
    if (reference !== undefined) return reference.resolved
  }

  return null
}

/**
 * Finds the declarator of a variable when it is a `const` that is never written after its
 * initialiser.
 *
 * @param variable - The variable to inspect.
 * @returns The declarator, or null when the variable is not a stable `const`.
 */
export function stableConstDeclarator(variable: Variable): ESTree.VariableDeclarator | null {
  const declarator = variableDeclarator(variable)
  if (
    declarator === null ||
    declarator.parent.type !== "VariableDeclaration" ||
    declarator.parent.kind !== "const"
  ) {
    return null
  }

  return variable.references.some((reference) => reference.isWrite() && !reference.init)
    ? null
    : declarator
}

/**
 * Finds what an expression's value is already known to be: a narrow asserted type, a syntactic
 * literal, or the annotation or initialiser of a stable `const` declared inside the same function.
 *
 * @param expression - The expression to trace.
 * @param flow - The function boundary and scopes the trace is confined to.
 * @param visitedVariables - Variables already traced, so a cycle stops.
 * @returns The evidence, with the known type or null for a syntactic value, or null when nothing is
 *   known.
 */
export function knownValueEvidence(
  expression: ESTree.Expression,
  flow: ValueFlow,
  visitedVariables: ReadonlySet<Variable>
): KnownValueEvidence | null {
  const unwrapped = unwrapExpressionParentheses(expression)
  if (unwrapped.type === "TSAsExpression" || unwrapped.type === "TSTypeAssertion") {
    return assertionEvidence(unwrapped.typeAnnotation)
  }

  if (SYNTACTIC_VALUES.has(unwrapped.type)) return { type: null }

  if (unwrapped.type !== "Identifier") return null

  const variable = resolvedVariableForIdentifier(flow.scopes, unwrapped)
  if (variable === null || visitedVariables.has(variable)) return null

  return variableEvidence(variable, flow, visitedVariables)
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

function variableEvidence(
  variable: Variable,
  flow: ValueFlow,
  visitedVariables: ReadonlySet<Variable>
): KnownValueEvidence | null {
  const annotated = variable.identifiers.find(
    (identifier) => identifier.typeAnnotation !== null && identifier.typeAnnotation !== undefined
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
