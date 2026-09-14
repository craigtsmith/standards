import type { Context, ESTree, SourceCode } from "@oxlint/plugins"

import type { WideningTarget } from "../types/dictionary-values.ts"
import type { TypeEnvironment } from "../types/type-environment.ts"
import { isTypeAssertion, type TypeAssertion } from "../ast/assertions.ts"
import { isEmptyObjectExpression } from "../ast/expressions.ts"
import { functionName, sourceKeyName, type FunctionExpression } from "../ast/local-functions.ts"
import { resolveVariable, variableDeclarator } from "../ast/variables.ts"
import { classifyWideningTarget } from "../types/dictionary-types.ts"
import { hasKnownEvidence } from "./known-evidence.ts"

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

/**
 * Reports a class property whose initialiser has a known shape but whose annotation widens it.
 */
export function propertyFlow(
  flow: Flow,
  node: ESTree.AccessorProperty | ESTree.PropertyDefinition
): void {
  if (node.value === null) return

  reportFlow(flow, {
    destination: annotationTarget(flow, node.typeAnnotation?.typeAnnotation),
    expression: node.value,
    subject: `property \`${sourceKeyName(flow.context.sourceCode, node.key)}\``,
  })
}

/**
 * Reports a plain `=` assignment to a local binding whose annotation widens a right-hand side of
 * known shape.
 */
export function assignmentFlow(flow: Flow, node: ESTree.AssignmentExpression): void {
  if (node.operator !== "=" || node.left.type !== "Identifier") return

  const declarator = assignedDeclarator(flow.context.sourceCode, node.left)
  if (declarator !== null) bindingFlow(flow, declarator.id, node.right)
}

/**
 * Reports a variable declarator whose initialiser has a known shape but whose annotation widens it.
 */
export function declaratorFlow(flow: Flow, node: ESTree.VariableDeclarator): void {
  if (node.init !== null) bindingFlow(flow, node.id, node.init)
}

/**
 * Reports a returned expression of known shape that the enclosing function's return type widens.
 */
export function returnFlow(
  flow: Flow,
  owner: FunctionExpression | null,
  expression: ESTree.Expression
): void {
  reportFlow(flow, {
    destination: annotationTarget(flow, owner?.returnType?.typeAnnotation),
    expression,
    subject: `return value of \`${functionName(flow.context.sourceCode, owner)}\``,
  })
}

/**
 * Reports an `as` or angle-bracket assertion that widens an expression of known shape. Only the
 * outermost of nested assertions is judged.
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

function assignedDeclarator(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference
): ESTree.VariableDeclarator | null {
  const variable = resolveVariable(sourceCode, identifier)

  return variable === null ? null : variableDeclarator(variable)
}

// Only a plain identifier binding carries an annotation that can widen the value.
function bindingFlow(
  flow: Flow,
  binding: ESTree.BindingPattern,
  expression: ESTree.Expression
): void {
  if (binding.type !== "Identifier") return

  reportFlow(flow, {
    destination: annotationTarget(flow, binding.typeAnnotation?.typeAnnotation),
    expression,
    subject: `binding \`${binding.name}\``,
  })
}

function hasParentAssertion(node: ESTree.Node): boolean {
  return node.parent !== null && isTypeAssertion(node.parent)
}

function annotationTarget(flow: Flow, type: ESTree.TSType | undefined): WideningTarget | null {
  if (flow.state.environment === null || type === undefined) return null

  return classifyWideningTarget(type, flow.state.environment)
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
