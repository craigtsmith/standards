import { defineConfig, type OxlintConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// Tests that do not run, or do not mean what they say.
const testing = {
  // On by default, so this line is load-bearing.
  "vitest/require-mock-type-parameters": "off",
} satisfies Rules

export const vitestRules: OxlintConfig = defineConfig({ rules: { ...testing } })
