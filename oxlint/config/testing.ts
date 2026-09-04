import { defineConfig } from "oxlint"

// Tests that do not run, or do not mean what they say.
export const testingRules = defineConfig({
  plugins: [],
  rules: {
    "vitest/require-mock-type-parameters": "off",
    "standards/no-module-mocking": "error",
    "sonarjs/stable-tests": "error",

    // Off, and off by default. Carried from agent-eslint-config.
    "vitest/prefer-lowercase-title": "off",
  },
})
