import type { Comment, Context, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { headerFault, isHeader, isJsdocLike, jsdocFault } from "./lib/ast/doc-blocks.ts"
import { exportedNames } from "./lib/ast/exported-declarations.ts"
import { ruleDocs, ruleOption } from "./lib/rule-meta.ts"

// One comment as the reader sees it: a block, or a run of adjacent line comments.
interface CommentSpan {
  readonly end: number
  readonly endLine: number
  readonly joinable: boolean
  readonly kind: SpanKind
  readonly start: number
  readonly startLine: number
  readonly why: string | null
}

// What the comment is, which decides the limit it answers to.
type SpanKind = "comment" | "documentation" | "header"

// Why a JSDoc-shaped block is an ordinary comment, or null when it is documentation.
const commentFault = (
  context: Context,
  comment: Comment,
  exported: ReadonlySet<string>
): string | null => (isJsdocLike(comment) ? jsdocFault(context, comment, exported) : null)

function spanKind(comment: Comment, header: boolean, why: string | null): SpanKind {
  if (header) return "header"

  return isJsdocLike(comment) && why === null ? "documentation" : "comment"
}

function commentSpan(
  context: Context,
  comment: Comment,
  exported: ReadonlySet<string>
): CommentSpan {
  const header = isHeader(context, comment)
  const why = header ? null : commentFault(context, comment, exported)
  const lineOf = (offset: number) => context.sourceCode.getLocFromIndex(offset).line

  return {
    end: comment.end,
    endLine: lineOf(comment.end),
    joinable: comment.type === "Line",
    kind: spanKind(comment, header, why),
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

function messageFor(run: CommentSpan): "docTooLong" | "looseJsdoc" | "tooLong" {
  if (run.kind !== "comment") return "docTooLong"

  return run.why === null ? "tooLong" : "looseJsdoc"
}

function reportRun(context: Context, run: CommentSpan, limit: number): void {
  const lines = run.endLine - run.startLine + 1
  if (lines <= limit) return

  context.report({
    data: { lines: String(lines), max: String(limit), why: run.why ?? "" },
    messageId: messageFor(run),
    loc: {
      end: context.sourceCode.getLocFromIndex(run.end),
      start: context.sourceCode.getLocFromIndex(run.start),
    },
  })
}

// Report the file header if it runs straight into code it does not document.
function checkHeader(
  context: Context,
  comments: readonly Comment[],
  exported: ReadonlySet<string>
): void {
  const header = comments.find((comment) => isHeader(context, comment))

  if (header !== undefined && headerFault(context, header, exported)) {
    context.report({ messageId: "header", node: header })
  }
}

export const maxCommentLinesRule: Rule = defineRule({
  meta: {
    defaultOptions: [{ max: 3, maxDoc: 15, maxHeader: 20 }],
    type: "suggestion",
    docs: ruleDocs(
      "max-comment-lines",
      "Limit the length of comments, documentation blocks and file headers."
    ),
    messages: {
      docTooLong: "This doc block is {{lines}} lines; the limit is {{max}}.",
      header: "A file header must be followed by a blank line.",
      tooLong: "This comment is {{lines}} lines; the limit is {{max}}.",
      looseJsdoc:
        "This comment is {{lines}} lines; the limit is {{max}}, and it is not JSDoc because it {{why}}.",
    },
    schema: [
      {
        additionalProperties: false,
        type: "object",
        properties: {
          max: { minimum: 1, type: "integer" },
          maxDoc: { minimum: 1, type: "integer" },
          maxHeader: { minimum: 1, type: "integer" },
        },
      },
    ],
  },

  createOnce(context) {
    return {
      Program(node) {
        const limits = {
          comment: Number(ruleOption(context, "max")),
          documentation: Number(ruleOption(context, "maxDoc")),
          header: Number(ruleOption(context, "maxHeader")),
        }
        const comments = node.comments.filter((comment) => comment.type !== "Shebang")
        const exported = exportedNames(node)
        checkHeader(context, comments, exported)
        const spans = comments.map((comment) => commentSpan(context, comment, exported))

        for (const run of commentRuns(context, spans)) {
          reportRun(context, run, limits[run.kind])
        }
      },
    }
  },
})
