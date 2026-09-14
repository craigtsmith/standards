import type { ESTree } from "@oxlint/plugins"

import { forEachChild, type VisitorKeys } from "../ast/walk.ts"

// A node on the way up from a use site, with the type parameter names it puts
// in scope there.
interface BinderScope {
  readonly binder: ESTree.Node
  readonly names: readonly string[]
}

/**
 * Every type parameter name in scope at a node, from enclosing declarations, mapped-type keys and
 * `infer` bindings. A type parameter shadows a module alias of the same name.
 */
export function lexicalTypeParameterNames(
  node: ESTree.Node,
  visitorKeys: VisitorKeys
): ReadonlySet<string> {
  return new Set(binderScopes(node, visitorKeys).flatMap(({ names }) => names))
}

/**
 * The closest node that binds a type parameter name at a node, or null when nothing binds it.
 */
export function nearestTypeParameterBinder(
  name: string,
  node: ESTree.Node,
  visitorKeys: VisitorKeys
): ESTree.Node | null {
  const scope = binderScopes(node, visitorKeys).find(({ names }) => names.includes(name))

  return scope?.binder ?? null
}

function binderScopes(node: ESTree.Node, visitorKeys: VisitorKeys): BinderScope[] {
  const scopes: BinderScope[] = []
  let descendant: ESTree.Node = node
  let current: ESTree.Node = node

  while (current.type !== "Program") {
    scopes.push({ binder: current, names: boundNames(current, descendant, visitorKeys) })

    descendant = current
    current = current.parent
  }

  return scopes
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

// A mapped type's key is in scope in its `as` clause and its template only.
function mappedKeyNames(node: ESTree.Node, descendant: ESTree.Node): string[] {
  if (node.type !== "TSMappedType") return []

  return descendant === node.nameType || descendant === node.typeAnnotation ? [node.key.name] : []
}

// `infer` bindings are in scope in the true branch only.
function conditionalInferNames(
  node: ESTree.Node,
  descendant: ESTree.Node,
  visitorKeys: VisitorKeys
): string[] {
  if (node.type !== "TSConditionalType" || descendant !== node.trueType) return []

  return inferTypeParameterNames(node.extendsType, visitorKeys)
}

function boundNames(
  node: ESTree.Node,
  descendant: ESTree.Node,
  visitorKeys: VisitorKeys
): string[] {
  return [
    ...typeParameterNames(node),
    ...mappedKeyNames(node, descendant),
    ...conditionalInferNames(node, descendant, visitorKeys),
  ]
}
