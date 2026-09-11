import { defineConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// Where TypeScript stops checking.
const typeSystem = {
  "unicorn/no-instanceof-builtins": "error",
} satisfies Rules

// The unhappy path: promises, await, throw and catch.
const failurePaths = {
  "unicorn/catch-error-name": ["error", { name: "error" }],
  "unicorn/custom-error-definition": "error",
  // Off: typescript/await-thenable, on through the correctness category,
  // reports the same node under the name this config uses elsewhere.
  "unicorn/no-unnecessary-await": "off",
  "unicorn/prefer-optional-catch-binding": "error",
} satisfies Rules

// Everything a reader must hold in their head to follow a function.
const cognitiveLoad = {
  // Allows a block function that uses its closure, which is why
  // sonarjs/no-function-declaration-in-block is off.
  "unicorn/consistent-function-scoping": "error",
  "unicorn/no-lonely-if": "error",
  // Off, and off by default. sonarjs/no-nested-conditional rejects the
  // nesting outright.
  "unicorn/no-nested-ternary": "off",
} satisfies Rules

// The surface a module presents: what it exports, imports and mutates.
const moduleSurface = {
  "unicorn/no-static-only-class": "error",
  "unicorn/prefer-class-fields": "error",
  "unicorn/prefer-node-protocol": "error",
} satisfies Rules

// Choices that are arbitrary alone and only pay off by being fixed.
const houseStyle = {
  "unicorn/filename-case": ["warn", { case: "kebabCase" }],
} satisfies Rules

// Off, and off by default. Carried from agent-eslint-config.
const offByDefault = {
  "unicorn/throw-new-error": "off",
} satisfies Rules

export const unicornRules = defineConfig({
  rules: {
    ...typeSystem,
    ...failurePaths,
    ...cognitiveLoad,
    ...moduleSurface,
    ...houseStyle,
    ...offByDefault,
  },
})
