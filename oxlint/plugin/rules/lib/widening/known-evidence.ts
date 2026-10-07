import type { ESTree, SourceCode, Variable } from "@oxlint/plugins"

import type { TypeEnvironment } from "../types/type-environment.ts"
import { isTypeAssertion } from "../ast/assertions.ts"
import { unwrapExpression } from "../ast/expressions.ts"
import {
  functionParameterBindingName,
  functionParameterTypeAnnotation,
} from "../ast/function-parameters.ts"
import { isFunctionExpression, localFunctionForCall } from "../ast/local-functions.ts"
import {
  resolveVariable,
  singleDefinition,
  stableConstDeclarator,
  variableDeclarator,
} from "../ast/variables.ts"
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

  const variable = unvisitedVariable(sourceCode, unwrapExpression(expression), visitedVariables)
  const initializer = followedInitializer(variable, visitedVariables)

  return initializer !== null && hasKnownEvidence(sourceCode, initializer, visitedVariables)
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
  if (isTypeAssertion(unwrapped)) {
    return hasInformativeType(unwrapped.typeAnnotation, lookup.environment)
  }

  if (unwrapped.type === "CallExpression") return hasInformativeReturn(lookup, unwrapped)

  return unwrapped.type === "Identifier"
    ? hasKnownVariableEvidence(
        lookup,
        unvisitedVariable(lookup.sourceCode, unwrapped, visitedVariables),
        visitedVariables
      )
    : isKnownValueExpression(unwrapped)
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

// The variable an identifier names, or null when it names none or the walk has been there.
function unvisitedVariable(
  sourceCode: SourceCode,
  expression: ESTree.Expression,
  visitedVariables: ReadonlySet<Variable>
): Variable | null {
  if (expression.type !== "Identifier") return null

  const variable = resolveVariable(sourceCode, expression)

  return variable === null || visitedVariables.has(variable) ? null : variable
}

// A stable `const` initialiser to follow, marking its variable visited so a cycle ends.
function followedInitializer(
  variable: Variable | null,
  visitedVariables: Set<Variable>
): ESTree.Expression | null {
  if (variable === null) return null

  const initializer = stableConstDeclarator(variable)?.init ?? null
  if (initializer !== null) visitedVariables.add(variable)

  return initializer
}

function variableTypeAnnotation(
  sourceCode: SourceCode,
  variable: Variable
): ESTree.TSTypeAnnotation | null {
  const declarator = variableDeclarator(variable)
  if (declarator === null) return parameterTypeAnnotation(sourceCode, variable)

  return declarator.id.type === "Identifier" ? (declarator.id.typeAnnotation ?? null) : null
}

function parameterTypeAnnotation(
  sourceCode: SourceCode,
  variable: Variable
): ESTree.TSTypeAnnotation | null {
  const definition = singleDefinition(variable)
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
  variable: Variable | null,
  visitedVariables: Set<Variable>
): boolean {
  if (variable === null) return false

  const annotation = variableTypeAnnotation(lookup.sourceCode, variable)
  if (annotation !== null) return hasInformativeType(annotation.typeAnnotation, lookup.environment)

  const initializer = followedInitializer(variable, visitedVariables)

  return initializer !== null && hasKnownCallArgumentEvidence(lookup, initializer, visitedVariables)
}
