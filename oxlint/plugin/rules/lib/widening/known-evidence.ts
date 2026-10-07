import type { ESTree, SourceCode, Variable } from "@oxlint/plugins"

import type { TypeEnvironment } from "../types/type-environment.ts"
import { unwrapExpression } from "../ast/expressions.ts"
import {
  functionParameterBindingName,
  functionParameterTypeAnnotation,
} from "../ast/function-parameters.ts"
import { isFunctionExpression, localFunctionForCall } from "../ast/local-functions.ts"
import { resolveVariable, singleDefinition, stableConstDeclarator } from "../ast/variables.ts"
import { classifyUnsafeDictionaryValue } from "../types/dictionary-types.ts"
import { isKnownValueExpression } from "./syntactic-values.ts"

export interface EvidenceLookup {
  readonly environment: TypeEnvironment
  readonly sourceCode: SourceCode
}

/**
 * Whether an expression has a shape the source states: a syntactic value, or a stable `const`
 * whose initialiser has one, followed transitively.
 */
export function hasKnownEvidence(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
  visitedVariables: Set<Variable> = new Set()
): boolean {
  if (isKnownValueExpression(expression)) return true

  const unwrapped = unwrapExpression(expression)
  if (unwrapped.type !== "Identifier") return false

  const variable = resolveVariable(sourceCode, unwrapped)
  if (variable === null || visitedVariables.has(variable)) return false

  const initializer = stableConstDeclarator(variable)?.init ?? null
  if (initializer === null) return false

  visitedVariables.add(variable)

  return hasKnownEvidence(sourceCode, initializer, visitedVariables)
}

/**
 * Whether a call argument's type says more than the `unknown` it is passed into, judged by its
 * assertion, a local callee's return type, its syntactic form, or the annotation or initialiser of
 * the variable it names.
 */
export function hasKnownCallArgumentEvidence(
  lookup: EvidenceLookup,
  expression: ESTree.Expression,
  visitedVariables: Set<Variable> = new Set()
): boolean {
  const unwrapped = unwrapToAssertion(expression)
  if (unwrapped.type === "TSAsExpression" || unwrapped.type === "TSTypeAssertion") {
    return hasInformativeType(unwrapped.typeAnnotation, lookup.environment)
  }

  if (unwrapped.type === "CallExpression") return hasInformativeReturn(lookup, unwrapped)

  if (unwrapped.type !== "Identifier") return isKnownValueExpression(unwrapped)

  const variable = resolveVariable(lookup.sourceCode, unwrapped)
  if (variable === null || visitedVariables.has(variable)) return false

  return hasKnownVariableEvidence(lookup, variable, visitedVariables)
}

// The walk stops at an assertion because that replaces the type, while the
// wrappers below keep it.
function unwrapToAssertion(expression: ESTree.Expression): ESTree.Expression {
  let current = expression

  while (
    current.type === "ParenthesizedExpression" ||
    current.type === "TSNonNullExpression" ||
    current.type === "TSSatisfiesExpression"
  ) {
    current = current.expression
  }

  return current
}

function variableTypeAnnotation(
  sourceCode: SourceCode,
  variable: Variable
): ESTree.TSTypeAnnotation | null {
  const definition = singleDefinition(variable)
  if (
    definition?.type === "Variable" &&
    definition.node.type === "VariableDeclarator" &&
    definition.node.id.type === "Identifier"
  ) {
    return definition.node.id.typeAnnotation ?? null
  }

  if (definition?.type !== "Parameter" || !isFunctionExpression(definition.node)) return null

  const parameter = definition.node.params.find(
    (candidate) => functionParameterBindingName(candidate, sourceCode) === variable.name
  )

  return parameter === undefined ? null : functionParameterTypeAnnotation(parameter)
}

function hasInformativeType(type: ESTree.TSType, environment: TypeEnvironment): boolean {
  return classifyUnsafeDictionaryValue(type, environment) === null
}

function hasInformativeReturn(lookup: EvidenceLookup, call: ESTree.CallExpression): boolean {
  const owner = localFunctionForCall(lookup.sourceCode, call.callee)
  const returnType = owner?.returnType?.typeAnnotation

  return returnType !== undefined && hasInformativeType(returnType, lookup.environment)
}

function hasKnownVariableEvidence(
  lookup: EvidenceLookup,
  variable: Variable,
  visitedVariables: Set<Variable>
): boolean {
  const annotation = variableTypeAnnotation(lookup.sourceCode, variable)
  if (annotation !== null) return hasInformativeType(annotation.typeAnnotation, lookup.environment)

  const initializer = stableConstDeclarator(variable)?.init ?? null
  if (initializer === null) return false

  visitedVariables.add(variable)

  return hasKnownCallArgumentEvidence(lookup, initializer, visitedVariables)
}
