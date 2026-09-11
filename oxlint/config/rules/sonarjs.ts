import { defineConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// Where TypeScript stops checking.
const typeSystem = {
  "sonarjs/prefer-type-guard": "error",
} satisfies Rules

// The unhappy path: throw and catch.
const failurePaths = {
  // Broader than oxc/missing-throw, which is off: this one also reports a
  // bare `new TypeError()` inside a branch, and custom Error subclasses.
  "sonarjs/no-unthrown-error": "error",
} satisfies Rules

// Everything a reader must hold in their head to follow a function.
const cognitiveLoad = {
  // Control flow.
  "sonarjs/elseif-without-else": "error",
  "sonarjs/misplaced-loop-counter": "error",
  "sonarjs/no-all-duplicated-branches": "error",
  "sonarjs/no-duplicated-branches": "error",
  // Off: unicorn/consistent-function-scoping covers it, and allows a block
  // function that uses its closure.
  "sonarjs/no-function-declaration-in-block": "off",
  "sonarjs/no-nested-assignment": "error",
  "sonarjs/no-nested-conditional": "error",
  "sonarjs/no-nested-functions": "error",
  "sonarjs/no-nested-incdec": "off",
  // Dead work the reader still has to parse. eslint/no-useless-assignment stays
  // too: neither subsumes the other, on one function they reported different lines.
  "sonarjs/no-redundant-assignments": "error",
  "sonarjs/no-useless-increment": "error",
  "sonarjs/too-many-break-or-continue-in-loop": "error",
  "sonarjs/updated-loop-counter": "error",
} satisfies Rules

// What may be reassigned, deleted or spread.
const moduleSurface = {
  "sonarjs/destructuring-assignment-syntax": "error",
} satisfies Rules

// Choices that are arbitrary alone and only pay off by being fixed.
const houseStyle = {
  "sonarjs/conditional-indentation": "off",
  "sonarjs/no-same-line-conditional": "error",
} satisfies Rules

// Credentials in source, and the two ways to run a string.
const security = {
  "sonarjs/no-hardcoded-ip": "error",
  "sonarjs/no-hardcoded-passwords": "error",
  "sonarjs/no-hardcoded-secrets": "error",
  "sonarjs/os-command": "error",
} satisfies Rules

// Tests that do not run, or do not mean what they say.
const testing = {
  "sonarjs/stable-tests": "error",
} satisfies Rules

export const sonarjsRules = defineConfig({
  overrides: [{ files: ["**/*.d.ts"], rules: { "sonarjs/no-redundant-assignments": "off" } }],
  rules: {
    ...typeSystem,
    ...failurePaths,
    ...cognitiveLoad,
    ...moduleSurface,
    ...houseStyle,
    ...security,
    ...testing,
  },
})
