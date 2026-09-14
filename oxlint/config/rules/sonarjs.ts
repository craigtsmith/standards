import { defineConfig, type OxlintConfig } from "oxlint"

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
  "sonarjs/no-nested-assignment": "error",
  // Rejects the nesting outright, so unicorn/no-nested-ternary is not needed.
  "sonarjs/no-nested-conditional": "error",
  "sonarjs/no-nested-functions": "error",
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

export const sonarjsRules: OxlintConfig = defineConfig({
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
