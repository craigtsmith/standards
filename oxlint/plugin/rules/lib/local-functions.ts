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
 * Reports whether a node is any function form: arrow, declaration, expression, or a bodiless
 * declaration.
 *
 * @param node - The node to test.
 * @returns Whether the node is a function.
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
 * Finds the function a callee refers to: the callee itself when it is a function literal, or the
 * single local definition of an identifier callee.
 *
 * @param sourceCode - The source code used to resolve the identifier.
 * @param callee - The call's callee expression.
 * @returns The function node, or null when the callee cannot be resolved to one
 * local function.
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
 *
 * @param sourceCode - The source code used to resolve the callee.
 * @param node - The call expression to inspect.
 * @returns The argument, owning function, and parameter, or null when the call is not a resolvable
 *   predicate call.
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
 * Reports whether a parameter is annotated with `unknown`, alone or as a union member.
 *
 * @param parameter - The parameter pattern to inspect.
 * @returns Whether the parameter's annotation contains `unknown`.
 */
export function hasUnknownAnnotation(parameter: FunctionParameter): boolean {
  const annotation = functionParameterTypeAnnotation(parameter)

  return (
    annotation !== null &&
    annotation !== undefined &&
    containsUnknownType(annotation.typeAnnotation)
  )
}

/**
 * Finds the nearest arrow function, function declaration, or function expression that contains a
 * node.
 *
 * @param node - The node to start from.
 * @returns The enclosing function, or null when the node sits at module level.
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
 * Gives a property key's name as written: an identifier's name, a literal's value, or the key's
 * source text.
 *
 * @param sourceCode - The source code used to read a computed key's text.
 * @param key - The property key to name.
 * @returns The key's name.
 */
export function sourceKeyName(sourceCode: SourceCode, key: ESTree.PropertyKey): string {
  if (key.type === "Identifier" || key.type === "PrivateIdentifier") return key.name

  if (key.type === "Literal") return String(key.value)

  return sourceCode.getText(key)
}

/**
 * Gives a function's name for a message, falling back to the variable or method it is assigned to.
 *
 * @param sourceCode - The source code used to read a method key's text.
 * @param owner - The function to name, or null when there is none.
 * @returns The name, or `anonymous function` when none can be found.
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
