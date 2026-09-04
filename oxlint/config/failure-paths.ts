import { defineConfig } from "oxlint"

// The unhappy path: promises, await, throw and catch.
export const failurePathsRules = defineConfig({
  plugins: [],
  rules: {
    "typescript/no-misused-promises": "error",
    "typescript/prefer-promise-reject-errors": "error",
    "typescript/only-throw-error": "error",
    "promise/always-return": ["warn", { ignoreLastCallback: true }],
    "promise/prefer-await-to-then": "error",
    "eslint/no-await-in-loop": "off",
    "eslint/preserve-caught-error": "error",
    "unicorn/catch-error-name": ["error", { name: "error" }],
    "unicorn/prefer-optional-catch-binding": "error",
    "unicorn/custom-error-definition": "error",
    "sonarjs/no-unthrown-error": "error",
    // Off: the sonarjs rule above is broader. It also reports a bare
    // `new TypeError()` inside a branch, and custom Error subclasses.
    "oxc/missing-throw": "off",
    // Off: typescript/await-thenable, on through the correctness category,
    // reports the same node under the name this config uses elsewhere.
    "unicorn/no-unnecessary-await": "off",

    // Off, and off by default. Carried from agent-eslint-config.
    "typescript/require-await": "off",
    "typescript/use-unknown-in-catch-callback-variable": "off",
    "unicorn/throw-new-error": "off",
  },
})
