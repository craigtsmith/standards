import type { ESTree } from "@oxlint/plugins"

import type { VisitorKeys } from "./walk.ts"
import { lexicalTypeParameterNames } from "./lexical-type-parameters.ts"
import { collectTypeBindings, nearestTypeBindings, type TypeBindings } from "./type-bindings.ts"
import { aliasArguments, typeReferenceName } from "./type-syntax.ts"

export interface TypeAliasEnvironment extends TypeBindings {
  readonly visitorKeys: VisitorKeys
}

export type ResolvedTypeMatcher = (
  type: ESTree.TSType,
  matches: (child: ESTree.TSType) => boolean
) => boolean

interface Substitution {
  readonly substitutions: Substitutions
  readonly type: ESTree.TSType
}

// `resolving` holds the aliases already being expanded, so resolution stops at
// a cycle.
interface Frame {
  readonly environment: TypeAliasEnvironment
  readonly resolving: ReadonlySet<ESTree.TSTypeAliasDeclaration>
  readonly substitutions: Substitutions
}

interface Resolved {
  readonly frame: Frame
  readonly type: ESTree.TSType
}

type Substitutions = ReadonlyMap<string, Substitution>

const environmentsByProgram = new WeakMap<ESTree.Program, TypeAliasEnvironment>()

/**
 * Collects the type bindings of a program, cached per program so every rule in a file shares one
 * walk.
 *
 * @param program - The file's root node.
 * @param visitorKeys - The child keys used to walk the tree.
 * @returns The bindings plus the visitor keys needed to resolve aliases later.
 */
export function createTypeAliasEnvironment(
  program: ESTree.Program,
  visitorKeys: VisitorKeys
): TypeAliasEnvironment {
  const cached = environmentsByProgram.get(program)
  if (cached !== undefined) return cached

  const environment = { ...collectTypeBindings(program, visitorKeys), visitorKeys }

  environmentsByProgram.set(program, environment)

  return environment
}

/**
 * Finds the single type alias a name refers to at a use site. A lexical type parameter shadows
 * every alias, and an ambiguous nearest scope yields nothing.
 *
 * @param name - The referenced name.
 * @param use - The node where the name is used.
 * @param environment - The file's type bindings and visitor keys.
 * @returns The alias declaration, or null when the name does not resolve to
 * exactly one alias.
 */
export function visibleTypeAlias(
  name: string,
  use: ESTree.Node,
  environment: TypeAliasEnvironment
): ESTree.TSTypeAliasDeclaration | null {
  if (lexicalTypeParameterNames(use, environment.visitorKeys).has(name)) return null

  const bindings = nearestTypeBindings(name, use, environment.bindingsByName)

  return bindings.length === 1 ? (bindings[0]?.alias ?? null) : null
}

/**
 * Reports whether a name is bound at a use site by a lexical type parameter or by any alias,
 * interface, enum, class or import in an enclosing scope.
 *
 * @param name - The referenced name.
 * @param use - The node where the name is used.
 * @param environment - The file's type bindings and visitor keys.
 * @returns Whether a local binding shadows the name.
 */
export function hasVisibleTypeBinding(
  name: string,
  use: ESTree.Node,
  environment: TypeAliasEnvironment
): boolean {
  return (
    lexicalTypeParameterNames(use, environment.visitorKeys).has(name) ||
    nearestTypeBindings(name, use, environment.bindingsByName).length > 0
  )
}

/**
 * Tests a type against a matcher after expanding aliases and type arguments, handing the matcher a
 * callback that expands and tests a child type the same way.
 *
 * @param type - The type to test.
 * @param environment - The file's type bindings and visitor keys.
 * @param matcher - Decides whether a resolved type matches, recursing through the callback where
 *   needed.
 * @returns Whether the resolved type matches.
 */
export function resolvedTypeMatches(
  type: ESTree.TSType,
  environment: TypeAliasEnvironment,
  matcher: ResolvedTypeMatcher
): boolean {
  const evaluate = (current: ESTree.TSType, frame: Frame): boolean => {
    const resolved = current.type === "TSTypeReference" ? resolveReference(current, frame) : null
    if (resolved !== null) return evaluate(resolved.type, resolved.frame)

    return matcher(current, (child) => evaluate(child, frame))
  }

  return evaluate(type, { environment, resolving: new Set(), substitutions: new Map() })
}

function resolveReference(reference: ESTree.TSTypeReference, frame: Frame): Resolved | null {
  const name = typeReferenceName(reference)
  if (name === null) return null

  const substitution = frame.substitutions.get(name)
  if (substitution !== undefined && !reference.typeArguments?.params.length) {
    return {
      frame: { ...frame, substitutions: substitution.substitutions },
      type: substitution.type,
    }
  }

  return resolveAlias(name, reference, frame)
}

function resolveAlias(
  name: string,
  reference: ESTree.TSTypeReference,
  frame: Frame
): Resolved | null {
  const alias = visibleTypeAlias(name, reference, frame.environment)
  if (alias === null || frame.resolving.has(alias)) return null

  const substitutions = aliasSubstitutions(alias, reference, frame.substitutions)
  if (substitutions === null) return null

  return {
    frame: { ...frame, resolving: new Set([...frame.resolving, alias]), substitutions },
    type: alias.typeAnnotation,
  }
}

function aliasSubstitutions(
  alias: ESTree.TSTypeAliasDeclaration,
  reference: ESTree.TSTypeReference,
  base: Substitutions
): Substitutions | null {
  const pairs = aliasArguments(alias, reference)
  if (pairs === null) return null

  const next = new Map(base)

  for (const { argument, explicit, parameter } of pairs) {
    // An explicit argument is read where the reference stands; a default is
    // read inside the alias, where the earlier parameters are already bound.
    next.set(parameter.name.name, {
      substitutions: new Map(explicit ? base : next),
      type: argument,
    })
  }

  return next
}
