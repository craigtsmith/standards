import type { ESTree } from "@oxlint/plugins"

// Ancestors that mark the declaration beneath them as public.
const EXPORTS: ReadonlySet<string> = new Set([
  "ExportDefaultDeclaration",
  "ExportNamedDeclaration",
  "TSExportAssignment",
])

// Walking up through one of these leaves a body and enters local scope.
const LOCAL_SCOPES: ReadonlySet<string> = new Set(["BlockStatement", "FunctionBody", "StaticBlock"])

const nameOf = (node: ESTree.Node | null): string[] =>
  node !== null && node.type === "Identifier" ? [node.name] : []

const isAmbient = (node: ESTree.Node): boolean => "declare" in node && node.declare

function declaredNames(node: ESTree.Node): string[] {
  if (node.type === "VariableDeclaration") {
    return node.declarations.flatMap((declarator) => nameOf(declarator.id))
  }

  return "id" in node ? nameOf(node.id) : []
}

// The local names a statement exports without declaring them.
function reExportedNames(statement: ESTree.Statement | ESTree.Directive): string[] {
  switch (statement.type) {
    case "ExportDefaultDeclaration":
      return nameOf(statement.declaration)
    case "ExportNamedDeclaration":
      return statement.source === null
        ? statement.specifiers.flatMap((specifier) => nameOf(specifier.local))
        : []
    case "TSExportAssignment":
      return nameOf(statement.expression)
    default:
      return []
  }
}

function ancestors(node: ESTree.Node): ESTree.Node[] {
  const chain: ESTree.Node[] = []

  for (let current: ESTree.Node | null = node; current !== null; current = current.parent) {
    chain.push(current)
  }

  return chain
}

// The nearest ancestor that settles visibility: an export, an ambient
// declaration, a local scope, or the top-level statement.
const settlesVisibility = (node: ESTree.Node): boolean =>
  EXPORTS.has(node.type) ||
  LOCAL_SCOPES.has(node.type) ||
  isAmbient(node) ||
  node.parent?.type === "Program"

/**
 * The local names a module exports by reference: through a specifier list, `export default name`
 * or `export = name`.
 */
export function exportedNames(program: ESTree.Program): ReadonlySet<string> {
  return new Set(program.body.flatMap(reExportedNames))
}

/**
 * Whether a declaration is part of the module's public surface: it, or a declaration enclosing it
 * without crossing a function body, is exported or ambient. `exported` comes from `exportedNames`.
 */
export function isPublicDeclaration(node: ESTree.Node, exported: ReadonlySet<string>): boolean {
  const root = ancestors(node).find(settlesVisibility)
  if (root === undefined || LOCAL_SCOPES.has(root.type)) return false

  return (
    EXPORTS.has(root.type) ||
    isAmbient(root) ||
    declaredNames(root).some((name) => exported.has(name))
  )
}
