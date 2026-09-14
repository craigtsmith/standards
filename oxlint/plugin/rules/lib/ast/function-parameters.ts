import type { ESTree, SourceCode } from "@oxlint/plugins"

export type FunctionParameter = ESTree.ParamPattern

/**
 * Whether a type is `unknown`, or a union with `unknown` as a member, looking through parentheses.
 */
export function containsUnknownType(type: ESTree.TSType): boolean {
  if (type.type === "TSUnknownKeyword") return true

  if (type.type === "TSParenthesizedType") return containsUnknownType(type.typeAnnotation)

  return type.type === "TSUnionType" && type.types.some(containsUnknownType)
}

/**
 * The type annotation on a parameter, looking through parameter properties, rest elements and
 * defaults to the binding beneath.
 */
export function functionParameterTypeAnnotation(
  parameter: FunctionParameter
): ESTree.TSTypeAnnotation | null {
  const annotation = ownTypeAnnotation(parameter)
  const inner = innerParameter(parameter)
  if (annotation !== null || inner === null) return annotation

  return functionParameterTypeAnnotation(inner)
}

/**
 * The name a parameter binds, through parameter properties, defaults and rest elements. A
 * destructuring pattern yields its source text without the type annotation.
 */
export function functionParameterBindingName(
  parameter: FunctionParameter,
  sourceCode: SourceCode
): string {
  const inner = innerParameter(parameter)
  if (inner !== null) return functionParameterBindingName(inner, sourceCode)

  if (parameter.type === "Identifier") return parameter.name

  return patternText(parameter, sourceCode)
}

// Parameter properties, rest elements and defaults wrap the binding they declare.
function innerParameter(parameter: FunctionParameter): FunctionParameter | null {
  if (parameter.type === "TSParameterProperty") return parameter.parameter

  if (parameter.type === "RestElement") return parameter.argument

  return parameter.type === "AssignmentPattern" ? parameter.left : null
}

// A parameter property's annotation belongs to the parameter it wraps.
function ownTypeAnnotation(parameter: FunctionParameter): ESTree.TSTypeAnnotation | null {
  return parameter.type === "TSParameterProperty" ? null : (parameter.typeAnnotation ?? null)
}

function patternText(pattern: FunctionParameter, sourceCode: SourceCode): string {
  const sourceText = sourceCode.getText(pattern)
  const annotationStart = ownTypeAnnotation(pattern)?.start

  return annotationStart === undefined
    ? sourceText
    : sourceText.slice(0, annotationStart - pattern.start).trimEnd()
}
