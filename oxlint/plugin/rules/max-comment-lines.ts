import type { Comment, Context, Options, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { headerFault, isHeader, isJsdocLike, jsdocFault } from "./lib/ast/doc-blocks.ts"
import { exportedNames } from "./lib/ast/exported-declarations.ts"

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

function commentSpan(
  context: Context,
  comment: Comment,
  exported: ReadonlySet<string>
): CommentSpan | null {
  const jsdocLike = isJsdocLike(comment)
  const why = jsdocLike ? jsdocFault(context, comment, exported) : null
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

// The file header, reported if it runs straight into code it does not document.
function checkedHeader(
  context: Context,
  comments: readonly Comment[],
  exported: ReadonlySet<string>
): Comment | undefined {
  const header = comments.find((comment) => isHeader(context, comment))

  if (header !== undefined && headerFault(context, header, exported)) {
    context.report({ messageId: "header", node: header })
  }

  return header
}

export const maxCommentLinesRule: Rule = defineRule({
  meta: {
    defaultOptions: [{ max: DEFAULT_MAX }],
    type: "suggestion",
    docs: {
      description:
        "Limit a comment to a few lines. Adjacent line comments count as one run, and a single blank line does not break the run. A well-formed JSDoc block on an exported declaration is exempt, as is a file header on line 1 followed by a blank line; any other block is an ordinary comment.",
    },
    messages: {
      header: "A file header must be followed by a blank line.",
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
        const exported = exportedNames(node)
        const comments = node.comments.filter((comment) => comment.type !== "Shebang")
        const header = checkedHeader(context, comments, exported)
        const spans = comments
          .filter((comment) => comment !== header)
          .flatMap((comment) => commentSpan(context, comment, exported) ?? [])

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
