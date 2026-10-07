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
 * A resolution for a type read at the top level, with no substitutions or aliases in progress.
 */
export function topLevelResolution(environment: TypeEnvironment): Resolution {
  return { environment, resolving: new Set(), substitutions: new Map() }
}

/**
 * Binds an alias's type parameters to the arguments a reference supplies, each resolved through
 * earlier bindings so a chain of parameters collapses. Null when a parameter has neither an
 * argument nor a default.
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
