import type { ESTree } from "@oxlint/plugins"

import type { TypeEnvironment } from "./type-environment.ts"
import { aliasArguments } from "./type-syntax.ts"

// `resolving` holds the alias declarations being expanded, so a cycle stops
// while a shadowed alias of the same name is still followed.
export interface Resolution {
  readonly environment: TypeEnvironment
  readonly resolving: ReadonlySet<ESTree.TSTypeAliasDeclaration>
  readonly substitutions: Substitutions
}

export interface ResolvedType {
  readonly resolution: Resolution
  readonly type: ESTree.TSType
}

// A type argument with the substitutions in force where it is written.
interface Substitution {
  readonly substitutions: Substitutions
  readonly type: ESTree.TSType
}

type Substitutions = ReadonlyMap<string, Substitution>

/**
 * A resolution for a type read at the top level, with no substitutions or aliases in progress.
 */
export function topLevelResolution(environment: TypeEnvironment): Resolution {
  return { environment, resolving: new Set(), substitutions: new Map() }
}

/**
 * The type a type parameter is bound to, read where its argument was written.
 */
export function substitutedType(name: string, resolution: Resolution): ResolvedType | null {
  const substitution = resolution.substitutions.get(name)
  if (substitution === undefined) return null

  return {
    resolution: { ...resolution, substitutions: substitution.substitutions },
    type: substitution.type,
  }
}

/**
 * An alias's body with its type parameters bound to the arguments a reference supplies. Null on a
 * cycle, or when a parameter has neither an argument nor a default.
 */
export function expandAlias(
  alias: ESTree.TSTypeAliasDeclaration,
  reference: ESTree.TSTypeReference,
  resolution: Resolution
): ResolvedType | null {
  if (resolution.resolving.has(alias)) return null

  const substitutions = aliasSubstitutions(alias, reference, resolution.substitutions)
  if (substitutions === null) return null

  return {
    type: alias.typeAnnotation,
    resolution: {
      ...resolution,
      resolving: new Set([...resolution.resolving, alias]),
      substitutions,
    },
  }
}

// An alias body sees only its own parameters. An explicit argument is read
// where the reference stands; a default is read inside the alias.
function aliasSubstitutions(
  alias: ESTree.TSTypeAliasDeclaration,
  reference: ESTree.TSTypeReference,
  outer: Substitutions
): Substitutions | null {
  const pairs = aliasArguments(alias, reference)
  if (pairs === null) return null

  const inner = new Map<string, Substitution>()

  for (const { argument, explicit, parameter } of pairs) {
    inner.set(parameter.name.name, {
      substitutions: explicit ? outer : new Map(inner),
      type: argument,
    })
  }

  return inner
}
