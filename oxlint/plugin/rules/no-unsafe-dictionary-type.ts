import type { ESTree, Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"

import { ruleDocs } from "./lib/rule-meta.ts"
import {
  classifyUnsafeDictionary,
  classifyUnsafeDictionaryValue,
} from "./lib/types/dictionary-types.ts"
import { visibleTypeAlias } from "./lib/types/type-alias-resolution.ts"
import { createTypeEnvironment, type TypeEnvironment } from "./lib/types/type-environment.ts"
import { typeReferenceName } from "./lib/types/type-syntax.ts"

const typeNodeKinds: ReadonlySet<string> = new Set([
  "JSDocNonNullableType",
  "JSDocNullableType",
  "JSDocUnknownType",
  "TSAnyKeyword",
  "TSArrayType",
  "TSBigIntKeyword",
  "TSBooleanKeyword",
  "TSConditionalType",
  "TSConstructorType",
  "TSFunctionType",
  "TSImportType",
  "TSIndexedAccessType",
  "TSInferType",
  "TSIntersectionType",
  "TSIntrinsicKeyword",
  "TSLiteralType",
  "TSMappedType",
  "TSNamedTupleMember",
  "TSNeverKeyword",
  "TSNullKeyword",
  "TSNumberKeyword",
  "TSObjectKeyword",
  "TSParenthesizedType",
  "TSStringKeyword",
  "TSSymbolKeyword",
  "TSTemplateLiteralType",
  "TSThisType",
  "TSTupleType",
  "TSTypeLiteral",
  "TSTypeOperator",
  "TSTypePredicate",
  "TSTypeQuery",
  "TSTypeReference",
  "TSUndefinedKeyword",
  "TSUnionType",
  "TSUnknownKeyword",
  "TSVoidKeyword",
])

function isTypeNode(node: ESTree.Node): node is ESTree.TSType {
  return typeNodeKinds.has(node.type)
}

function isInsideTypeAliasDeclaration(node: ESTree.TSType): boolean {
  let current: ESTree.Node = node.parent

  while (current.type !== "Program") {
    if (current.type === "TSTypeAliasDeclaration") return true

    current = current.parent
  }

  return false
}

function isPlainAliasConsumerUse(node: ESTree.TSType, environment: TypeEnvironment): boolean {
  if (node.type !== "TSTypeReference" || node.typeArguments?.params.length) return false

  const name = typeReferenceName(node)

  return (
    name !== null &&
    visibleTypeAlias(name, node, environment.typeAliases) !== null &&
    !isInsideTypeAliasDeclaration(node)
  )
}

function isInsideTypeParameterConstraint(node: ESTree.TSType): boolean {
  let child: ESTree.Node = node
  let parent: ESTree.Node = child.parent

  while (parent.type !== "Program") {
    if (parent.type === "TSTypeParameter" && parent.constraint === child) return true

    child = parent
    parent = child.parent
  }

  return false
}

function shouldReportType(node: ESTree.TSType, environment: TypeEnvironment): boolean {
  if (isInsideTypeParameterConstraint(node)) return false

  if (isPlainAliasConsumerUse(node, environment)) return false

  if (classifyUnsafeDictionary(node, environment) === null) return false

  let current: ESTree.Node = node.parent

  while (current.type !== "Program") {
    if (isTypeNode(current) && classifyUnsafeDictionary(current, environment) !== null) return false

    current = current.parent
  }

  return true
}

export const noUnsafeDictionaryTypeRule: Rule = defineRule({
  meta: {
    type: "problem",
    docs: ruleDocs(
      "no-unsafe-dictionary-type",
      "Disallow dictionary types whose values are `unknown`, `any`, `object` or `{}`."
    ),
    messages: {
      unsafeDictionary:
        "This dictionary's {{value}} value type says nothing about its values. Use a precise value type and parse input before storing it.",
    },
  },

  createOnce(context) {
    let environment: TypeEnvironment | null = null
    const report = (node: ESTree.Node, value: string) => {
      context.report({ data: { value }, messageId: "unsafeDictionary", node })
    }
    const reportIfUnsafe = (node: ESTree.TSType) => {
      if (environment === null || !shouldReportType(node, environment)) return

      const unsafe = classifyUnsafeDictionary(node, environment)
      if (unsafe === null) return

      report(node, unsafe.unsafeValue)
    }

    return {
      TSMappedType: reportIfUnsafe,
      TSTypeLiteral: reportIfUnsafe,
      TSTypeReference: reportIfUnsafe,

      Program(node) {
        environment = createTypeEnvironment(node, context.sourceCode.visitorKeys)
      },
      TSIndexSignature(node) {
        if (environment === null || node.parent.type === "TSTypeLiteral") return

        const unsafe = classifyUnsafeDictionaryValue(
          node.typeAnnotation.typeAnnotation,
          environment
        )
        if (unsafe !== null) report(node, unsafe.unsafeValue)
      },
    }
  },
})
