import type { ESTree, Options } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

type TypeAssertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion

const DEFAULT_SAFETY_MARKERS = ["SAFETY"] as const

const commentOwnerKinds = new Set([
  "ExpressionStatement",
  "PropertyDefinition",
  "ReturnStatement",
  "ThrowStatement",
  "VariableDeclaration",
])

function isConstAssertion(node: TypeAssertion): boolean {
  return (
    node.typeAnnotation.type === "TSTypeReference" &&
    node.typeAnnotation.typeName.type === "Identifier" &&
    node.typeAnnotation.typeName.name === "const"
  )
}

// Among JSON primitives, a string is the one equal to its own `String()`.
function isNonBlankString(value: Options[number]): value is string {
  return !(value instanceof Object) && String(value) === value && value.trim().length > 0
}

function configuredSafetyMarkers(option: Options[number] | undefined): readonly string[] {
  if (!(option instanceof Object) || Array.isArray(option)) return DEFAULT_SAFETY_MARKERS

  const configured = option["markers"]
  if (!Array.isArray(configured)) return DEFAULT_SAFETY_MARKERS

  const markers = configured.filter(isNonBlankString).map((marker) => marker.trim())

  return markers.length > 0 ? markers : DEFAULT_SAFETY_MARKERS
}

function markerPattern(markers: readonly string[]): RegExp {
  const alternation = markers
    .map((marker) => marker.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`))
    .join("|")

  return new RegExp(String.raw`(?:^|[^\p{L}\p{N}_])(?:${alternation})\s*:\s*\S`, "u")
}

// An exported statement's comment sits before the export, so the walk up has to
// check the `ExportNamedDeclaration` parent as well.
function hasSafetyComment(node: ESTree.Node, justified: (owner: ESTree.Node) => boolean): boolean {
  if (justified(node)) return true

  const parent = node.parent
  if (parent === null) return false

  if (commentOwnerKinds.has(node.type)) {
    return (
      parent.type === "ExportNamedDeclaration" && parent.declaration === node && justified(parent)
    )
  }

  return parent.type !== "Program" && hasSafetyComment(parent, justified)
}

export const requireSafetyCommentForTypeAssertionRule = defineRule({
  meta: {
    defaultOptions: [{ markers: ["SAFETY"] }],
    type: "problem",
    docs: {
      description:
        "Require a nearby SAFETY comment for every TypeScript type assertion except const assertions.",
    },
    messages: {
      missingSafetyComment:
        "This type assertion has no `{{marker}}:` justification. State the checked invariant immediately before the assertion or its containing statement.",
    },
    schema: [
      {
        additionalProperties: false,
        type: "object",
        properties: {
          markers: {
            items: { minLength: 1, type: "string" },
            minItems: 1,
            type: "array",
            uniqueItems: true,
          },
        },
      },
    ],
  },

  createOnce(context) {
    const patterns = new Map<string, RegExp>()

    const checkAssertion = (node: TypeAssertion) => {
      if (isConstAssertion(node)) return

      const markers = configuredSafetyMarkers(context.options[0])
      const patternKey = markers.join(" ")
      const pattern = patterns.get(patternKey) ?? markerPattern(markers)

      patterns.set(patternKey, pattern)

      const justified = (owner: ESTree.Node) =>
        context.sourceCode
          .getCommentsBefore(owner)
          .some((comment) => comment.end <= node.start && pattern.test(comment.value))

      if (hasSafetyComment(node, justified)) return

      context.report({
        data: { marker: markers[0] ?? DEFAULT_SAFETY_MARKERS[0] },
        messageId: "missingSafetyComment",
        node,
      })
    }

    return { TSAsExpression: checkAssertion, TSTypeAssertion: checkAssertion }
  },
})
