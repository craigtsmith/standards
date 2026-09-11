import type { ESTree } from "@oxlint/plugins"

import type { VisitorKeys } from "../ast/walk.ts"
import { createTypeAliasEnvironment, type TypeAliasEnvironment } from "./type-alias-resolution.ts"

export interface TypeEnvironment {
  readonly interfaces: ReadonlyMap<string, readonly ESTree.TSInterfaceDeclaration[]>
  readonly typeAliases: TypeAliasEnvironment
}

/**
 * Builds the type environment for a file: its top-level interface declarations by name, and the
 * cached type alias environment.
 *
 * @param program - The file's root node.
 * @param visitorKeys - The child keys used to walk the tree.
 * @returns The interfaces and alias environment used to resolve references.
 */
export function createTypeEnvironment(
  program: ESTree.Program,
  visitorKeys: VisitorKeys
): TypeEnvironment {
  const interfaces = new Map<string, ESTree.TSInterfaceDeclaration[]>()

  for (const statement of program.body) {
    const declaration = declaredStatement(statement)
    if (declaration?.type !== "TSInterfaceDeclaration") continue

    const declarations = interfaces.get(declaration.id.name) ?? []

    declarations.push(declaration)
    interfaces.set(declaration.id.name, declarations)
  }

  return { interfaces, typeAliases: createTypeAliasEnvironment(program, visitorKeys) }
}

function declaredStatement(statement: ESTree.Statement): ESTree.Node | null {
  return statement.type === "ExportNamedDeclaration" ||
    statement.type === "ExportDefaultDeclaration"
    ? (statement.declaration ?? null)
    : statement
}
