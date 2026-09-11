import type { ESTree } from "@oxlint/plugins"

import type { TypeEnvironment } from "./type-environment.ts"
import { aliasArguments, typeReferenceName, unwrapTransparentType } from "./type-syntax.ts"

export interface Resolution {
  readonly environment: TypeEnvironment
  readonly resolving: ReadonlySet<string>
  readonly substitutions: Substitutions
}

export type Substitutions = ReadonlyMap<string, ESTree.TSType>

/**
 * Builds the resolution for a type read at the top level, with no substitutions and no aliases in
 * progress.
 *
 * @param environment - The file's interfaces and type aliases.
 * @returns A fresh resolution over the environment.
 */
export function topLevelResolution(environment: TypeEnvironment): Resolution {
  return { environment, resolving: new Set(), substitutions: new Map() }
}

/**
 * Binds an alias's type parameters to the arguments a reference supplies, with each argument
 * resolved through earlier bindings so a chain of parameters collapses.
 *
 * @param alias - The alias being expanded.
 * @param reference - The reference supplying the type arguments.
 * @param base - The substitutions in force where the reference stands.
 * @returns The extended substitutions, or null when a parameter has neither an argument nor a
 *   default.
 */
export function aliasSubstitution(
  alias: ESTree.TSTypeAliasDeclaration,
  reference: ESTree.TSTypeReference,
  base: Substitutions
): Substitutions | null {
  const pairs = aliasArguments(alias, reference)
  if (pairs === null) return null

  const next = new Map(base)

  for (const { argument, parameter } of pairs) {
    next.set(parameter.name.name, resolvedSubstitutionArgument(argument, next, new Set()))
  }

  return next
}

function resolvedSubstitutionArgument(
  type: ESTree.TSType,
  base: Substitutions,
  resolving: ReadonlySet<string>
): ESTree.TSType {
  const unwrapped = unwrapTransparentType(type)
  if (unwrapped.type !== "TSTypeReference") return type

  const name = typeReferenceName(unwrapped)
  if (name === null || resolving.has(name)) return type

  const substitution = base.get(name)
  if (substitution === undefined) return type

  return resolvedSubstitutionArgument(substitution, base, new Set([...resolving, name]))
}
