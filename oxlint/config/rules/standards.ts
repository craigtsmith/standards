import { defineConfig, type OxlintConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// Where TypeScript stops checking, and where it checks something vague.
const typeSystem = {
  "standards/no-chained-type-assertions": "error",
  "standards/no-known-value-widening": "error",
  "standards/no-reflect-apply": "error",
  "standards/no-reflect-get": "error",
  // A type predicate is where a typeof check becomes a contract, so it is allowed there.
  "standards/no-runtime-typeof": ["error", { allowInTypeGuards: true }],
  "standards/no-unknown-parameters": "error",
  "standards/no-unknown-returns": "error",
  "standards/no-unknown-type-aliases": "error",
  "standards/no-unsafe-dictionary-type": "error",
  "standards/no-widen-then-assert": "error",
  "standards/require-safety-comment-for-type-assertion": "error",
} satisfies Rules

// The surface a module presents: what it exports, imports and mutates.
const moduleSurface = {
  "standards/no-conditional-empty-object-spread": "error",
  "standards/no-object-parameters": "error",
} satisfies Rules

// Choices that are arbitrary alone and only pay off by being fixed.
const houseStyle = {
  "standards/max-comment-lines": "error",
} satisfies Rules

// Tests that do not run, or do not mean what they say.
const testing = {
  "standards/no-module-mocking": "error",
} satisfies Rules

export const standardsRules: OxlintConfig = defineConfig({
  rules: { ...typeSystem, ...moduleSurface, ...houseStyle, ...testing },
})
