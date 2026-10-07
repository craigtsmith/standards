import type { Definition, ESTree, Rule, SourceCode } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { resolveVariable } from "./lib/ast/variables.ts"
import { ruleDocs } from "./lib/rule-meta.ts"

const moduleMockMethods = new Set(["doMock", "mock", "unstable_mockModule"])
const frameworkGlobals = new Set(["jest", "vi"])
// Each framework's module and the name it exports its mocking object under.
const frameworkImports = new Map([
  ["@jest/globals", "jest"],
  ["vitest", "vi"],
])

function importedName(node: ESTree.Node): string | null {
  if (node.type !== "ImportSpecifier") return null

  return node.imported.type === "Identifier" ? node.imported.name : node.imported.value
}

function isFrameworkImport(definition: Definition): boolean {
  if (definition.type !== "ImportBinding" || definition.parent?.type !== "ImportDeclaration") {
    return false
  }

  return frameworkImports.get(definition.parent.source.value) === importedName(definition.node)
}

// An unresolved name, or one with no definition, counts by name alone.
function resolvesToFramework(
  sourceCode: SourceCode,
  identifier: ESTree.IdentifierReference
): boolean {
  const variable = resolveVariable(sourceCode, identifier)
  if (variable === null || variable.defs.length === 0) return frameworkGlobals.has(identifier.name)

  return variable.defs.some(isFrameworkImport)
}

function isTestFrameworkObject(
  sourceCode: SourceCode,
  expression: ESTree.Expression
): expression is ESTree.IdentifierReference {
  if (expression.type !== "Identifier") return false

  const global = frameworkGlobals.has(expression.name) && sourceCode.isGlobalReference(expression)

  return global || resolvesToFramework(sourceCode, expression)
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
