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
  if (parameter.type === "TSParameterProperty") {
    return functionParameterTypeAnnotation(parameter.parameter)
  }

  if (parameter.type === "RestElement") {
    return parameter.typeAnnotation ?? functionParameterTypeAnnotation(parameter.argument)
  }

  if (parameter.type === "AssignmentPattern") {
    return parameter.typeAnnotation ?? functionParameterTypeAnnotation(parameter.left)
  }

  return parameter.typeAnnotation ?? null
}

/**
 * The name a parameter binds, through parameter properties, defaults and rest elements. A
 * destructuring pattern yields its source text without the type annotation.
 */
export function functionParameterBindingName(
  parameter: FunctionParameter,
  sourceCode: SourceCode
): string {
  if (parameter.type === "TSParameterProperty") {
    return functionParameterBindingName(parameter.parameter, sourceCode)
  }

  if (parameter.type === "AssignmentPattern") {
    return functionParameterBindingName(parameter.left, sourceCode)
  }

  if (parameter.type === "RestElement") {
    return functionParameterBindingName(parameter.argument, sourceCode)
  }

  if (parameter.type === "Identifier") return parameter.name

  const sourceText = sourceCode.getText(parameter)
  const annotationStart = parameter.typeAnnotation?.start

  return annotationStart === undefined
    ? sourceText
    : sourceText.slice(0, annotationStart - parameter.start).trimEnd()
}
