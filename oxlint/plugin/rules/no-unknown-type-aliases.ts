import type { ESTree, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { ruleDocs } from "./lib/rule-meta.ts"
import {
  createTypeAliasEnvironment,
  resolvedTypeMatches,
  type TypeAliasEnvironment,
} from "./lib/types/type-alias-resolution.ts"

export const noUnknownTypeAliasesRule: Rule = defineRule({
  meta: {
    docs: ruleDocs("no-unknown-type-aliases", "Disallow type aliases that resolve to `unknown`."),
    type: "problem",
    messages: {
      unknownAlias:
        "Type alias `{{alias}}` hides `unknown` behind a name. Write `unknown` where it is used, or alias the parsed type.",
    },
  },

  createOnce(context) {
    let environment: TypeAliasEnvironment | null = null

    const resolvesToUnknown = (type: ESTree.TSType): boolean =>
      environment !== null &&
      resolvedTypeMatches(type, environment, (resolved, matches) => {
        if (resolved.type === "TSUnknownKeyword") return true

        if (resolved.type === "TSParenthesizedType") {
          return matches(resolved.typeAnnotation)
        }

        return resolved.type === "TSUnionType" && resolved.types.some(matches)
      })

    return {
      Program(node) {
        environment = createTypeAliasEnvironment(node, context.sourceCode.visitorKeys)
      },
      TSTypeAliasDeclaration(node) {
        if (!resolvesToUnknown(node.typeAnnotation)) return

        context.report({ data: { alias: node.id.name }, messageId: "unknownAlias", node: node.id })
      },
    }
  },
})
