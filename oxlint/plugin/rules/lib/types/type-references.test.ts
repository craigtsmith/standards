import type { Rule } from "@oxlint/plugins"
import { defineRule } from "@oxlint/plugins"
import { RuleTester } from "oxlint/plugins-dev"
import { describe, it } from "vitest"

import { createTypeEnvironment, type TypeEnvironment } from "./type-environment.ts"
import { resolvedTypeMatches, type ResolvedTypeMatcher } from "./type-references.ts"

// Follows function returns and conditional branches, which no shipped rule reads,
// so a type parameter bound inside them can be checked.
const reachesUnknown: ResolvedTypeMatcher = (type, matches) => {
  switch (type.type) {
    case "TSConditionalType":
      return matches(type.trueType)
    case "TSFunctionType":
      return matches(type.returnType.typeAnnotation)
    default:
      return type.type === "TSUnknownKeyword"
  }
}

const probeRule: Rule = defineRule({
  meta: { messages: { unknown: "Resolves to `unknown`." }, type: "problem" },

  createOnce(context) {
    let environment: TypeEnvironment | null = null

    return {
      Program(node) {
        environment = createTypeEnvironment(node, context.sourceCode.visitorKeys)
      },
      TSTypeAliasDeclaration(node) {
        if (environment === null) return

        if (!resolvedTypeMatches(node.typeAnnotation, environment, reachesUnknown)) return

        context.report({ messageId: "unknown", node: node.id })
      },
    }
  },
})

const error = [{ messageId: "unknown" }]

// Built here because the shared tester lives in the rules zone, which this one may not import.
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } })

ruleTester.run("resolved-type-matches", probeRule, {
  invalid: [
    { code: "type Id<T> = () => T; type Loaded = Id<unknown>", errors: error },
    {
      code: "type When<T> = Box extends T ? T : never; type Loaded = When<unknown>",
      errors: error,
    },
  ],
  valid: [
    "type Id<T> = () => T; type Loaded = Id<string>",
    // A binder inside an alias body shadows the alias parameter of the same name.
    "type Id<T> = <T>(value: T) => T; type Loaded = Id<unknown>",
    "type Unwrap<T> = Box extends Wrap<infer T> ? T : never; type Loaded = Unwrap<unknown>",
  ],
})
