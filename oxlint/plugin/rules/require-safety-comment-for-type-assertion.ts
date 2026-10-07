import type { ESTree, Options, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { isConstAssertion, type TypeAssertion } from "./lib/ast/assertions.ts"
import { ruleDocs, ruleOption } from "./lib/rule-meta.ts"

const commentOwnerKinds = new Set([
  "ExpressionStatement",
  "PropertyDefinition",
  "ReturnStatement",
  "ThrowStatement",
  "VariableDeclaration",
])

// The schema and default guarantee a non-empty list of non-blank strings.
function configuredMarkers(value: Options[number] | undefined): readonly string[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((marker) => (marker instanceof Object ? [] : [String(marker).trim()]))
}

function markerPattern(markers: readonly string[]): RegExp {
  const alternation = markers
    .map((marker) => marker.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`))
    .join("|")

  return new RegExp(String.raw`(?:^|[^\p{L}\p{N}_])(?:${alternation})\s*:\s*\S`, "u")
}

// An exported statement's comment sits before the export, so the walk up has to
// check the `ExportNamedDeclaration` parent as well.
function isJustifiedExport(
  node: ESTree.Node,
  parent: ESTree.Node,
  justified: (owner: ESTree.Node) => boolean
): boolean {
  return (
    parent.type === "ExportNamedDeclaration" && parent.declaration === node && justified(parent)
  )
}

function hasSafetyComment(node: ESTree.Node, justified: (owner: ESTree.Node) => boolean): boolean {
  if (justified(node)) return true

  const parent = node.parent
  if (parent === null) return false

  if (commentOwnerKinds.has(node.type)) return isJustifiedExport(node, parent, justified)

  return parent.type !== "Program" && hasSafetyComment(parent, justified)
}

export const requireSafetyCommentForTypeAssertionRule: Rule = defineRule({
  meta: {
    defaultOptions: [{ markers: ["SAFETY"] }],
    type: "problem",
    docs: ruleDocs(
      "require-safety-comment-for-type-assertion",
      "Require a justification comment before each type assertion except `as const`."
    ),
    messages: {
      missingSafetyComment:
        "This type assertion has no `{{marker}}:` comment. State why it is safe above the assertion or its statement.",
    },
    schema: [
      {
        additionalProperties: false,
        type: "object",
        properties: {
          markers: {
            items: { minLength: 1, pattern: "\\S", type: "string" },
            minItems: 1,
            type: "array",
            uniqueItems: true,
          },
        },
      },
    ],
  },

  createOnce(context) {
    // Set per file by `Program`, which is visited before any assertion.
    let markers: readonly string[] = []
    let pattern = markerPattern(markers)

    const checkAssertion = (node: TypeAssertion) => {
      if (isConstAssertion(node)) return

      const justified = (owner: ESTree.Node) =>
        context.sourceCode
          .getCommentsBefore(owner)
          .some((comment) => comment.end <= node.start && pattern.test(comment.value))

      if (hasSafetyComment(node, justified)) return

      context.report({
        data: { marker: markers[0] ?? "" },
        messageId: "missingSafetyComment",
        node,
      })
    }

    return {
      TSAsExpression: checkAssertion,
      TSTypeAssertion: checkAssertion,

      Program() {
        markers = configuredMarkers(ruleOption(context, "markers"))
        pattern = markerPattern(markers)
      },
    }
  },
})
