import type { ESTree } from "@oxlint/plugins"

import { forEachChild, type VisitorKeys } from "./walk.ts"

/**
 * Collects every type parameter name in scope at a node, walking up through enclosing declarations,
 * mapped-type keys, and `infer` bindings, since a type parameter shadows a module alias of the same
 * name.
 *
 * @param node - The node whose enclosing scopes are searched.
 * @param visitorKeys - The visitor keys used to walk `infer` positions inside conditional types.
 * @returns The set of type parameter names visible at the node.
 */
export function lexicalTypeParameterNames(
  node: ESTree.Node,
  visitorKeys: VisitorKeys
): ReadonlySet<string> {
  const names = new Set<string>()
  let descendant: ESTree.Node = node
  let current: ESTree.Node = node

  while (current.type !== "Program") {
    for (const name of boundNames(current, descendant, visitorKeys)) names.add(name)

    descendant = current
    current = current.parent
  }

  return names
}

function typeParameterNames(node: ESTree.Node): string[] {
  if (!("typeParameters" in node)) return []

  return (node.typeParameters?.params ?? []).map((parameter) => parameter.name.name)
}

function inferTypeParameterNames(type: ESTree.TSType, visitorKeys: VisitorKeys): string[] {
  const names: string[] = []
  const visit = (node: ESTree.Node): void => {
    if (node.type === "TSInferType") names.push(node.typeParameter.name.name)

    forEachChild(node, visitorKeys, visit)
  }

  visit(type)

  return names
}

function boundNames(
  node: ESTree.Node,
  descendant: ESTree.Node,
  visitorKeys: VisitorKeys
): string[] {
  const names = typeParameterNames(node)

  if (
    node.type === "TSMappedType" &&
    (descendant === node.nameType || descendant === node.typeAnnotation)
  ) {
    names.push(node.key.name)
  }

  if (node.type === "TSConditionalType" && descendant === node.trueType) {
    names.push(...inferTypeParameterNames(node.extendsType, visitorKeys))
  }

  return names
}
