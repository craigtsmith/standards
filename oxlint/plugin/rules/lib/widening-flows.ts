import type { Context, ESTree } from "@oxlint/plugins"

import {
  classifyWideningTarget,
  type TypeEnvironment,
  type WideningTarget,
} from "./dictionary-types.ts"
import { isEmptyObjectExpression } from "./expressions.ts"
import { hasKnownEvidence } from "./known-evidence.ts"
import { functionName, sourceKeyName, type FunctionExpression } from "./local-functions.ts"
import { resolveVariable, variableDeclarator } from "./variables.ts"

export interface FileState {
  environment: TypeEnvironment | null
}

export interface Flow {
  readonly context: Context
  readonly state: FileState
}

interface WideningFlow {
  readonly destination: WideningTarget | null
  readonly expression: ESTree.Expression
  readonly subject: string
}

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion

/**
 * Reports a class property whose initialiser has a known shape but whose annotation widens it.
 *
 * @param flow - The rule context and the file's type environment.
 * @param node - The class property or accessor property.
 */
export function propertyFlow(
  flow: Flow,
  node: ESTree.AccessorProperty | ESTree.PropertyDefinition
): void {
  if (node.value === null) return

  reportFlow(flow, {
    destination: annotationTarget(flow, node.typeAnnotation),
    expression: node.value,
    subject: `property \`${sourceKeyName(flow.context.sourceCode, node.key)}\``,
  })
}

/**
 * Reports a plain `=` assignment to a local binding whose declared annotation widens a right-hand
 * side of known shape.
 *
 * @param flow - The rule context and the file's type environment.
 * @param node - The assignment expression.
 */
export function assignmentFlow(flow: Flow, node: ESTree.AssignmentExpression): void {
  if (node.operator !== "=" || node.left.type !== "Identifier") return

  const variable = resolveVariable(flow.context.sourceCode, node.left)
  const declarator = variable === null ? null : variableDeclarator(variable)
  if (declarator === null || declarator.id.type !== "Identifier") return

  reportFlow(flow, {
    destination: annotationTarget(flow, declarator.id.typeAnnotation),
    expression: node.right,
    subject: `binding \`${declarator.id.name}\``,
  })
}

/**
 * Reports a variable declarator whose initialiser has a known shape but whose annotation widens it.
 *
 * @param flow - The rule context and the file's type environment.
 * @param node - The variable declarator.
 */
export function declaratorFlow(flow: Flow, node: ESTree.VariableDeclarator): void {
  if (node.init === null || node.id.type !== "Identifier") return

  reportFlow(flow, {
    destination: annotationTarget(flow, node.id.typeAnnotation),
    expression: node.init,
    subject: `binding \`${node.id.name}\``,
  })
}

/**
 * Reports a returned expression of known shape that the enclosing function's return annotation
 * widens.
 *
 * @param flow - The rule context and the file's type environment.
 * @param owner - The function returning the expression, or null when none encloses it.
 * @param expression - The returned expression.
 */
export function returnFlow(
  flow: Flow,
  owner: FunctionExpression | null,
  expression: ESTree.Expression
): void {
  reportFlow(flow, {
    destination: annotationTarget(flow, owner?.returnType),
    expression,
    subject: `return value of \`${functionName(flow.context.sourceCode, owner)}\``,
  })
}

/**
 * Reports an `as` or angle-bracket assertion that widens an expression of known shape. The
 * outermost of nested assertions is the one judged.
 *
 * @param flow - The rule context and the file's type environment.
 * @param node - The assertion expression.
 */
export function assertionFlow(flow: Flow, node: TypeAssertion): void {
  if (flow.state.environment === null || hasParentAssertion(node)) return

  reportFlow(flow, {
    destination: classifyWideningTarget(node.typeAnnotation, flow.state.environment),
    expression: node.expression,
    subject: "assertion",
  })
}

function isDictionaryAccumulatorTarget(destination: WideningTarget): boolean {
  return destination.kind === "open dictionary" || destination.kind === "generic container"
}

function hasParentAssertion(node: ESTree.Node): boolean {
  return node.parent?.type === "TSAsExpression" || node.parent?.type === "TSTypeAssertion"
}

function annotationTarget(
  flow: Flow,
  annotation: ESTree.TSTypeAnnotation | null | undefined
): WideningTarget | null {
  if (flow.state.environment === null || annotation === null || annotation === undefined) {
    return null
  }

  return classifyWideningTarget(annotation.typeAnnotation, flow.state.environment)
}

function reportFlow(flow: Flow, { destination, expression, subject }: WideningFlow): void {
  if (destination === null) return

  if (isDictionaryAccumulatorTarget(destination) && isEmptyObjectExpression(expression)) return

  if (!hasKnownEvidence(flow.context.sourceCode, expression)) return

  flow.context.report({
    data: { subject, target: destination.kind },
    messageId: "widening",
    node: expression,
  })
}
