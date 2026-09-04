import type { ESTree, SourceCode } from "@oxlint/plugins"

export type FunctionParameter = ESTree.ParamPattern

/**
 * Reports whether a type is `unknown`, or a union that has `unknown` as a member, looking through
 * parentheses.
 *
 * @param type - The type annotation to inspect.
 * @returns Whether `unknown` appears at the top level of the type.
 */
export function containsUnknownType(type: ESTree.TSType): boolean {
  if (type.type === "TSUnknownKeyword") return true

  if (type.type === "TSParenthesizedType") return containsUnknownType(type.typeAnnotation)

  return type.type === "TSUnionType" && type.types.some(containsUnknownType)
}

/**
 * Finds the type annotation on a function parameter, looking through parameter properties, rest
 * elements, and default-value patterns to the binding beneath.
 *
 * @param parameter - The parameter pattern to inspect.
 * @returns The annotation, or null or undefined when the parameter has none.
 */
export function functionParameterTypeAnnotation(
  parameter: FunctionParameter
): ESTree.TSTypeAnnotation | null | undefined {
  if (parameter.type === "TSParameterProperty") {
    return functionParameterTypeAnnotation(parameter.parameter)
  }

  if (parameter.type === "RestElement") {
    return parameter.typeAnnotation ?? functionParameterTypeAnnotation(parameter.argument)
  }

  if (parameter.type === "AssignmentPattern") {
    return parameter.typeAnnotation ?? functionParameterTypeAnnotation(parameter.left)
  }

  return parameter.typeAnnotation
}

/**
 * Gives the name a function parameter binds, unwrapping parameter properties, defaults, and rest
 * elements. A destructuring pattern yields its source text with any type annotation removed.
 *
 * @param parameter - The parameter pattern to name.
 * @param sourceCode - The source code used to read a pattern's text.
 * @returns The identifier name or the pattern's text.
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
