import type { ESTree } from "@oxlint/plugins"

import { forEachChild, type VisitorKeys } from "../ast/walk.ts"

export interface TypeBinding {
  readonly alias: ESTree.TSTypeAliasDeclaration | null
  readonly name: string
  readonly scope: ESTree.Node
}

export interface TypeBindings {
  readonly aliases: readonly ESTree.TSTypeAliasDeclaration[]
  readonly bindingsByName: ReadonlyMap<string, readonly TypeBinding[]>
}

type DeclaredBinding = Omit<TypeBinding, "scope">

const scopeKinds = new Set([
  "BlockStatement",
  "Program",
  "StaticBlock",
  "SwitchStatement",
  "TSModuleBlock",
])

/**
 * Every type-level name a program declares by an alias, interface, enum, class or import, grouped
 * by name and tagged with its scope.
 */
export function collectTypeBindings(
  program: ESTree.Program,
  visitorKeys: VisitorKeys
): TypeBindings {
  const aliases: ESTree.TSTypeAliasDeclaration[] = []
  const bindingsByName = new Map<string, TypeBinding[]>()
  const record = (declared: DeclaredBinding, node: ESTree.Node) => {
    const bindings = bindingsByName.get(declared.name) ?? []

    bindings.push({ ...declared, scope: enclosingTypeScope(node) })
    bindingsByName.set(declared.name, bindings)

    if (declared.alias !== null) aliases.push(declared.alias)
  }
  const visit = (node: ESTree.Node): void => {
    const declared = declaredTypeBinding(node)
    if (declared !== null) record(declared, node)

    forEachChild(node, visitorKeys, visit)
  }

  visit(program)

  return { aliases, bindingsByName }
}

/**
 * The bindings of a name in the closest scope enclosing a use site. Several come back when that
 * scope declares the name more than once, and none when no scope declares it.
 */
export function nearestTypeBindings(
  name: string,
  use: ESTree.Node,
  bindingsByName: TypeBindings["bindingsByName"]
): readonly TypeBinding[] {
  const candidates = bindingsByName.get(name) ?? []
  const measured = candidates.map((candidate) => ({
    candidate,
    distance: ancestorDistance(candidate.scope, use) ?? Number.POSITIVE_INFINITY,
  }))
  const nearest = Math.min(...measured.map(({ distance }) => distance))

  return measured
    .filter(({ distance }) => distance === nearest && distance !== Number.POSITIVE_INFINITY)
    .map(({ candidate }) => candidate)
}

function enclosingTypeScope(node: ESTree.Node): ESTree.Node {
  let current = node.parent

  while (current !== null) {
    if (scopeKinds.has(current.type)) return current

    current = current.parent
  }

  return node
}

function declaredTypeBinding(node: ESTree.Node): DeclaredBinding | null {
  if (node.type === "TSTypeAliasDeclaration") return { alias: node, name: node.id.name }

  if (
    node.type === "TSInterfaceDeclaration" ||
    node.type === "TSEnumDeclaration" ||
    node.type === "ClassDeclaration" ||
    node.type === "ClassExpression"
  ) {
    return node.id === null ? null : { alias: null, name: node.id.name }
  }

  if (
    node.type === "ImportSpecifier" ||
    node.type === "ImportDefaultSpecifier" ||
    node.type === "ImportNamespaceSpecifier"
  ) {
    return { alias: null, name: node.local.name }
  }

  return null
}

function ancestorDistance(ancestor: ESTree.Node, node: ESTree.Node): number | null {
  let current: ESTree.Node | null = node
  let distance = 0

  while (current !== null) {
    if (current === ancestor) return distance

    current = current.parent
    distance += 1
  }

  return null
}
