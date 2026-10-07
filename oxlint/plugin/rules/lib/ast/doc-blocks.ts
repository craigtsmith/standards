import type { Comment, Context, ESTree, Token } from "@oxlint/plugins"

import { DOCUMENTED } from "./documented-nodes.ts"
import { isPublicDeclaration } from "./exported-declarations.ts"

const OPENING_LINE = /^\*[ \t]*\r?$/u
const BODY_LINE = /^\s*\*/u
const CLOSING_LINE = /^\s*$/u

// Null when the block has the JSDoc shape, otherwise the reason it does not.
function malformed(comment: Comment): string | null {
  const lines = comment.value.split("\n")
  if (lines.length === 1) return null

  const faults: readonly (readonly [boolean, string])[] = [
    [!OPENING_LINE.test(lines[0] ?? ""), "has text on its opening line"],
    [!CLOSING_LINE.test(lines.at(-1) ?? ""), "has text on its closing line"],
    [!lines.slice(1, -1).every((line) => BODY_LINE.test(line)), "has a line without a leading *"],
  ]

  return faults.find(([faulty]) => faulty)?.[1] ?? null
}

// Every node that begins at an offset, innermost first.
function nodesStartingAt(context: Context, index: number): ESTree.Node[] {
  const nodes: ESTree.Node[] = []

  for (
    let node = context.sourceCode.getNodeByRangeIndex(index);
    node?.start === index;
    node = node.parent
  ) {
    nodes.push(node)
  }

  return nodes
}

// The declaration a /** block sits on, or null when it is not on one.
function documented(context: Context, token: Token | null): ESTree.Node | null {
  if (token === null) return null

  return nodesStartingAt(context, token.start).find((node) => DOCUMENTED.has(node.type)) ?? null
}

// A tag at the start of a line. An inline `{@link}` does not match.
const BLOCK_TAG = /^[ \t]*\*?[ \t]*@\w+/mu

// A block on something private is JSDoc only when it carries a tag.
const hasBlockTag = (comment: Comment): boolean => BLOCK_TAG.test(comment.value)

// Everything in a declaration file is ambient, so all of it is public.
const isPublic = (context: Context, node: ESTree.Node, exported: ReadonlySet<string>): boolean =>
  context.filename.endsWith(".d.ts") || isPublicDeclaration(node, exported)

// Null when the block is documentation, otherwise why it is an ordinary comment.
function placementFault(
  context: Context,
  comment: Comment,
  exported: ReadonlySet<string>
): string | null {
  const token = context.sourceCode.getTokenAfter(comment)
  // A decorator is not indexed by range, so a block above one resolves to the
  // whole program; a decorator always attaches to a declaration.
  if (token?.value === "@") return null

  const node = documented(context, token)
  if (node === null) return "documents nothing"

  if (isPublic(context, node, exported) || hasBlockTag(comment)) return null

  return "documents an unexported declaration and carries no tag"
}

/**
 * Whether a comment is a block that opens with `/**`, whatever else it does.
 */
export const isJsdocLike = (comment: Comment): boolean =>
  comment.type === "Block" && comment.value.startsWith("*")

// The first line of a file, or the second when the first is a shebang.
const headerLine = (context: Context): number =>
  context.sourceCode.lines[0]?.startsWith("#!") === true ? 2 : 1

const lineAfter = (context: Context, comment: Comment): string | undefined =>
  context.sourceCode.lines[context.sourceCode.getLocFromIndex(comment.end).line]

const blankLineAfter = (context: Context, comment: Comment): boolean =>
  /^\s*$/u.test(lineAfter(context, comment) ?? "")

/**
 * Whether a comment is the file header: a well-formed block on the first line, before any token.
 */
export function isHeader(context: Context, comment: Comment): boolean {
  return (
    isJsdocLike(comment) &&
    malformed(comment) === null &&
    context.sourceCode.getTokenBefore(comment) === null &&
    context.sourceCode.getLocFromIndex(comment.start).line === headerLine(context)
  )
}

/**
 * Whether a file header is missing the blank line after it. A header may run straight into code
 * only when it is JSDoc for that code.
 */
export function headerFault(
  context: Context,
  header: Comment,
  exported: ReadonlySet<string>
): boolean {
  return !blankLineAfter(context, header) && placementFault(context, header, exported) !== null
}

/**
 * Why a JSDoc-shaped block is an ordinary comment, or null when it is documentation.
 */
export function jsdocFault(
  context: Context,
  comment: Comment,
  exported: ReadonlySet<string>
): string | null {
  return malformed(comment) ?? placementFault(context, comment, exported)
}
