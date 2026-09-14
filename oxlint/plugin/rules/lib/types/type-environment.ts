import type { ESTree } from "@oxlint/plugins"

import type { VisitorKeys } from "../ast/walk.ts"
import { lexicalTypeParameterNames } from "./lexical-type-parameters.ts"
import {
  collectTypeBindings,
  nearestTypeBindings,
  type BindingsByName,
  type TypeBinding,
} from "./type-bindings.ts"

export interface TypeEnvironment {
  readonly bindingsByName: BindingsByName
  readonly visitorKeys: VisitorKeys
}

const environmentsByProgram = new WeakMap<ESTree.Program, TypeEnvironment>()

/**
 * A file's type bindings, cached per program so every rule in a file shares one walk.
 */
export function createTypeEnvironment(
  program: ESTree.Program,
  visitorKeys: VisitorKeys
): TypeEnvironment {
  const cached = environmentsByProgram.get(program)
  if (cached !== undefined) return cached

  const environment = { bindingsByName: collectTypeBindings(program, visitorKeys), visitorKeys }

  environmentsByProgram.set(program, environment)

  return environment
}

/**
 * The bindings a name refers to at a use site, from the nearest scope that declares it. Null when
 * a lexical type parameter shadows the name.
 */
export function visibleTypeBindings(
  name: string,
  use: ESTree.Node,
  environment: TypeEnvironment
): readonly TypeBinding[] | null {
  if (lexicalTypeParameterNames(use, environment.visitorKeys).has(name)) return null

  return nearestTypeBindings(name, use, environment.bindingsByName)
}

/**
 * The single type alias a name refers to at a use site, or null when it refers to anything else.
 */
export function visibleTypeAlias(
  name: string,
  use: ESTree.Node,
  environment: TypeEnvironment
): ESTree.TSTypeAliasDeclaration | null {
  const bindings = visibleTypeBindings(name, use, environment) ?? []
  const declaration = bindings.length === 1 ? bindings[0]?.declaration : null

  return declaration?.type === "TSTypeAliasDeclaration" ? declaration : null
}
