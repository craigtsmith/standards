import type { ESTree, Rule, SourceCode } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { resolveVariable } from "./lib/ast/variables.ts"
import { ruleDocs } from "./lib/rule-meta.ts"

const moduleMockMethods = new Set(["doMock", "mock", "unstable_mockModule"])

function importedName(node: ESTree.Node): string | null {
  if (node.type !== "ImportSpecifier") return null

  return node.imported.type === "Identifier" ? node.imported.name : node.imported.value
}

function isTestFrameworkObject(
  sourceCode: SourceCode,
  expression: ESTree.Expression
): expression is ESTree.IdentifierReference {
  if (expression.type !== "Identifier") return false

  if (
    (expression.name === "vi" || expression.name === "jest") &&
    sourceCode.isGlobalReference(expression)
  ) {
    return true
  }

  const variable = resolveVariable(sourceCode, expression)
  if (variable === null || variable.defs.length === 0) {
    return expression.name === "vi" || expression.name === "jest"
  }

  return variable.defs.some((definition) => {
    if (definition.type !== "ImportBinding" || definition.parent?.type !== "ImportDeclaration") {
      return false
    }

    const source = definition.parent.source.value
    const name = importedName(definition.node)

    return (source === "vitest" && name === "vi") || (source === "@jest/globals" && name === "jest")
  })
}

function memberName(callee: { computed: boolean; property: ESTree.Node }): string | null {
  const { computed, property } = callee
  if (!computed) return property.type === "Identifier" ? property.name : null

  return property.type === "Literal" ? String(property.value) : null
}

function moduleMockCall(sourceCode: SourceCode, callee: ESTree.Expression): boolean {
  if (!("property" in callee) || !("object" in callee) || !("computed" in callee)) return false

  if (!isTestFrameworkObject(sourceCode, callee.object)) return false

  const method = memberName(callee)

  return method !== null && moduleMockMethods.has(method)
}

export const noModuleMockingRule: Rule = defineRule({
  meta: {
    docs: ruleDocs("no-module-mocking", "Disallow Vitest and Jest module mocking."),
    type: "problem",
    messages: {
      moduleMock:
        "This call replaces a module for every importer. Pass the dependency in through an interface instead.",
    },
  },

  createOnce(context) {
    return {
      CallExpression(node) {
        if (moduleMockCall(context.sourceCode, node.callee)) {
          context.report({ messageId: "moduleMock", node })
        }
      },
    }
  },
})
