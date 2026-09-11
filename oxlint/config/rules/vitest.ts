import { defineConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// Tests that do not run, or do not mean what they say.
const testing = {
  "vitest/require-mock-type-parameters": "off",
} satisfies Rules

// Off, and off by default. Carried from agent-eslint-config.
const offByDefault = {
  "vitest/prefer-lowercase-title": "off",
} satisfies Rules

export const vitestRules = defineConfig({ rules: { ...testing, ...offByDefault } })
