import type { Definition, ESTree, SourceCode } from "@oxlint/plugins"

import { unwrapExpression } from "./expressions.ts"
import {
  containsUnknownType,
  functionParameterBindingName,
  functionParameterTypeAnnotation,
  type FunctionParameter,
} from "./function-parameters.ts"
import { resolveVariable, singleDefinition } from "./variables.ts"

export interface PredicateCall {
  readonly argument: ESTree.Expression
  readonly owner: FunctionExpression
  readonly parameter: FunctionParameter
}

export type FunctionExpression = ESTree.ArrowFunctionExpression | ESTree.Function

/**
 * Whether a node is any function form, bodiless declarations included.
 */
export function isFunctionExpression(node: ESTree.Node): node is FunctionExpression {
  return (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "TSDeclareFunction" ||
    node.type === "TSEmptyBodyFunctionExpression"
  )
}

/**
 * The function a callee refers to: the callee itself when it is a function literal, or the single
 * local definition of an identifier callee.
 */
export function localFunctionForCall(
  sourceCode: SourceCode,
  callee: ESTree.Expression
): FunctionExpression | null {
  const unwrapped = unwrapExpression(callee)
  if (isFunctionExpression(unwrapped)) return unwrapped

  if (unwrapped.type !== "Identifier") return null

  const definition = singleDefinition(resolveVariable(sourceCode, unwrapped))

  return definition === undefined ? null : definedFunction(definition)
}

/**
 * Matches a call to a local type-predicate function and pairs the predicate's subject parameter
 * with the argument passed for it.
 */
export function predicateCall(
  sourceCode: SourceCode,
  node: ESTree.CallExpression
): PredicateCall | null {
  const owner = localFunctionForCall(sourceCode, node.callee)
  const index = owner === null ? null : typePredicateSubjectIndex(sourceCode, owner)
  if (owner === null || index === null) return null

  const parameter = owner.params[index]
  const argument = node.arguments[index]
  if (parameter === undefined || argument === undefined || argument.type === "SpreadElement") {
    return null
  }

  return { argument, owner, parameter }
}

/**
 * Whether a parameter is annotated with `unknown`, alone or as a union member.
 */
export function hasUnknownAnnotation(parameter: FunctionParameter): boolean {
  const annotation = functionParameterTypeAnnotation(parameter)

  return annotation !== null && containsUnknownType(annotation.typeAnnotation)
}

/**
 * The nearest function with a body at or above a node, or null at module level.
 */
export function enclosingFunction(node: ESTree.Node): FunctionExpression | null {
  let current: ESTree.Node = node

  while (current.type !== "Program") {
    if (
      current.type === "ArrowFunctionExpression" ||
      current.type === "FunctionDeclaration" ||
      current.type === "FunctionExpression"
    ) {
      return current
    }

    current = current.parent
  }

  return null
}

/**
 * A property key's name as written: an identifier's name, a literal's value, or its source text.
 */
export function sourceKeyName(sourceCode: SourceCode, key: ESTree.PropertyKey): string {
  if (key.type === "Identifier" || key.type === "PrivateIdentifier") return key.name

  if (key.type === "Literal") return String(key.value)

  return sourceCode.getText(key)
}

/**
 * A function's name for a message, falling back to the variable or method it is assigned to.
 */
export function functionName(sourceCode: SourceCode, owner: FunctionExpression | null): string {
  if (owner === null) return "anonymous function"

  if (owner.id !== null) return owner.id.name

  const parent = owner.parent
  if (parent.type === "VariableDeclarator" && parent.id.type === "Identifier") {
    return parent.id.name
  }

  if (parent.type === "MethodDefinition") return sourceKeyName(sourceCode, parent.key)

  return "anonymous function"
}

function typePredicateSubjectIndex(
  sourceCode: SourceCode,
  owner: FunctionExpression
): number | null {
  const predicate = owner.returnType?.typeAnnotation
  if (predicate?.type !== "TSTypePredicate" || predicate.parameterName.type !== "Identifier") {
    return null
  }

  const subject = predicate.parameterName.name
  const index = owner.params.findIndex(
    (parameter) => functionParameterBindingName(parameter, sourceCode) === subject
  )

  return index === -1 ? null : index
}

function definedFunction(definition: Definition): FunctionExpression | null {
  if (definition.type === "FunctionName") {
    return isFunctionExpression(definition.node) ? definition.node : null
  }

  if (
    definition.type !== "Variable" ||
    definition.node.type !== "VariableDeclarator" ||
    definition.node.init === null
  ) {
    return null
  }

  const initializer = unwrapExpression(definition.node.init)

  return isFunctionExpression(initializer) ? initializer : null
}
