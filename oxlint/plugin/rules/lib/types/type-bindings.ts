import type { ESTree } from "@oxlint/plugins"

import { forEachChild, type VisitorKeys } from "../ast/walk.ts"

// `declaration` is null for a class, enum or import, which bind a name the
// resolver does not look inside.
export interface TypeBinding {
  readonly declaration: TypeDeclaration | null
  readonly name: string
  readonly scope: ESTree.Node
}

export type TypeDeclaration = ESTree.TSInterfaceDeclaration | ESTree.TSTypeAliasDeclaration

export type BindingsByName = ReadonlyMap<string, readonly TypeBinding[]>

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
): BindingsByName {
  const bindingsByName = new Map<string, TypeBinding[]>()
  const visit = (node: ESTree.Node): void => {
    const declared = declaredTypeBinding(node)

    if (declared !== null) {
      const bindings = bindingsByName.get(declared.name) ?? []

      bindings.push({ ...declared, scope: enclosingTypeScope(node) })
      bindingsByName.set(declared.name, bindings)
    }

    forEachChild(node, visitorKeys, visit)
  }

  visit(program)

  return bindingsByName
}

/**
 * The bindings of a name in the closest scope enclosing a use site. Several come back when that
 * scope declares the name more than once, and none when no scope declares it.
 */
export function nearestTypeBindings(
  name: string,
  use: ESTree.Node,
  bindingsByName: BindingsByName
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
  return declarationBinding(node) ?? namedValueBinding(node) ?? importBinding(node)
}

// An alias or interface, which the resolver can look inside.
function declarationBinding(node: ESTree.Node): DeclaredBinding | null {
  return node.type === "TSTypeAliasDeclaration" || node.type === "TSInterfaceDeclaration"
    ? { declaration: node, name: node.id.name }
    : null
}

// An enum or class, which may be anonymous.
function namedValueBinding(node: ESTree.Node): DeclaredBinding | null {
  if (
    node.type !== "TSEnumDeclaration" &&
    node.type !== "ClassDeclaration" &&
    node.type !== "ClassExpression"
  ) {
    return null
  }

  return node.id === null ? null : { declaration: null, name: node.id.name }
}

function importBinding(node: ESTree.Node): DeclaredBinding | null {
  return node.type === "ImportSpecifier" ||
    node.type === "ImportDefaultSpecifier" ||
    node.type === "ImportNamespaceSpecifier"
    ? { declaration: null, name: node.local.name }
    : null
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
