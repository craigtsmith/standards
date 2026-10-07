import type { ESTree } from "@oxlint/plugins"

import type { VisitorKeys } from "../ast/walk.ts"
import { createTypeAliasEnvironment, type TypeAliasEnvironment } from "./type-alias-resolution.ts"

export interface TypeEnvironment {
  readonly interfaces: ReadonlyMap<string, readonly ESTree.TSInterfaceDeclaration[]>
  readonly typeAliases: TypeAliasEnvironment
}

/**
 * A file's top-level interfaces by name, and its cached type alias environment.
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
