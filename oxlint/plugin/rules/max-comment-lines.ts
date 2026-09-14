import type { Comment, Context, Options, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { DOCUMENTED } from "./lib/ast/documented-nodes.ts"

const DEFAULT_MAX = 2

// One comment as the reader sees it: a block, or a run of adjacent line comments.
interface CommentSpan {
  readonly end: number
  readonly endLine: number
  readonly joinable: boolean
  readonly start: number
  readonly startLine: number
  readonly why: string | null
}

// Null when the block has the JSDoc shape, otherwise the reason it does not.
function malformed(comment: Comment): string | null {
  const lines = comment.value.split("\n")
  if (lines.length === 1) return null

  if (!/^\*[ \t]*\r?$/u.test(lines[0] ?? "")) return "has text on its opening line"

  if (!/^\s*$/u.test(lines.at(-1) ?? "")) return "has text on its closing line"

  return lines.slice(1, -1).every((line) => /^\s*\*/u.test(line))
    ? null
    : "has a line without a leading *"
}

function documentsSomething(context: Context, comment: Comment): boolean {
  if (context.sourceCode.getTokenBefore(comment) === null) return true

  const token = context.sourceCode.getTokenAfter(comment)
  if (token === null) return false

  // A decorator is not indexed by range, so a block above one resolves to the
  // whole program; a decorator always attaches to a declaration.
  if (token.value === "@") return true

  let node = context.sourceCode.getNodeByRangeIndex(token.start)

  while (node !== null && node.start === token.start) {
    if (DOCUMENTED.has(node.type)) return true

    node = node.parent
  }

  return false
}

function jsdocReason(context: Context, comment: Comment): string | null {
  const formFault = malformed(comment)
  if (formFault !== null) return formFault

  return documentsSomething(context, comment) ? null : "documents nothing"
}

function commentSpan(context: Context, comment: Comment): CommentSpan | null {
  const jsdocLike = comment.type === "Block" && comment.value.startsWith("*")
  const why = jsdocLike ? jsdocReason(context, comment) : null
  if (jsdocLike && why === null) return null

  const lineOf = (offset: number) => context.sourceCode.getLocFromIndex(offset).line

  return {
    end: comment.end,
    endLine: lineOf(comment.end),
    joinable: comment.type === "Line",
    start: comment.start,
    startLine: lineOf(comment.start),
    why,
  }
}

// A blank line, or one holding nothing but `//`, does not end a comment.
function bridges(context: Context, line: number): boolean {
  return /^[ \t]*(?:\/\/[ \t]*)?\r?$/u.test(context.sourceCode.lines[line - 1] ?? "x")
}

function commentRuns(context: Context, spans: readonly CommentSpan[]): CommentSpan[] {
  const runs: CommentSpan[] = []

  for (const span of spans) {
    const last = runs.at(-1)
    const gap = last === undefined ? 0 : span.startLine - last.endLine
    const joins =
      last !== undefined &&
      last.joinable &&
      span.joinable &&
      (gap === 1 || (gap === 2 && bridges(context, last.endLine + 1)))

    if (joins) runs[runs.length - 1] = { ...last, end: span.end, endLine: span.endLine }
    else runs.push(span)
  }

  return runs
}

function configuredMax(option: Options[number] | undefined): number {
  if (!(option instanceof Object) || Array.isArray(option)) return DEFAULT_MAX

  const max = Number(option["max"])

  return Number.isInteger(max) && max > 0 ? max : DEFAULT_MAX
}

export const maxCommentLinesRule: Rule = defineRule({
  meta: {
    defaultOptions: [{ max: DEFAULT_MAX }],
    type: "suggestion",
    docs: {
      description:
        "Limit a comment to a few lines. Adjacent line comments count as one run, and a single blank line does not break the run.",
    },
    messages: {
      looseJsdoc: "This comment (not JSDoc - {{why}}) is {{lines}} lines; limit is {{max}}.",
      tooLong: "This comment is {{lines}} lines; limit is {{max}}.",
    },
    schema: [
      {
        additionalProperties: false,
        properties: { max: { minimum: 1, type: "integer" } },
        type: "object",
      },
    ],
  },

  createOnce(context) {
    return {
      Program(node) {
        const max = configuredMax(context.options[0])
        const spans = node.comments
          .filter((comment) => comment.type !== "Shebang")
          .flatMap((comment) => {
            const span = commentSpan(context, comment)

            return span === null ? [] : [span]
          })

        for (const run of commentRuns(context, spans)) {
          const lines = run.endLine - run.startLine + 1
          if (lines <= max) continue

          context.report({
            data: { lines: String(lines), max: String(max), why: run.why ?? "" },
            messageId: run.why === null ? "tooLong" : "looseJsdoc",
            loc: {
              end: context.sourceCode.getLocFromIndex(run.end),
              start: context.sourceCode.getLocFromIndex(run.start),
            },
          })
        }
      },
    }
  },
})
