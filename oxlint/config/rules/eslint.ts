import { defineConfig, type OxlintConfig } from "oxlint"

import { testFiles, type Rules } from "./shared.ts"

// The unhappy path: promises, await, throw and catch.
const failurePaths = {
  // On by default, so this line is load-bearing.
  "eslint/no-await-in-loop": "off",
  "eslint/preserve-caught-error": "error",
} satisfies Rules

// Everything a reader must hold in their head to follow a function.
const cognitiveLoad = {
  // Size budgets.
  "eslint/max-depth": ["error", 2],
  "eslint/max-lines": ["error", { max: 150, skipBlankLines: true, skipComments: true }],
  // fallow's health.maxUnitSize is 40 too, but counts blank and comment
  // lines and ignores a wider set of paths. Both stay.
  "eslint/max-lines-per-function": ["error", { max: 40, skipBlankLines: true, skipComments: true }],
  "eslint/max-nested-callbacks": ["error", 3],
  "eslint/max-params": ["error", 3],
  "eslint/max-statements": ["error", 10],
  // sonarjs/no-redundant-assignments stays too. Neither subsumes the other:
  // on one function they reported different lines.
  "eslint/no-useless-assignment": "error",
} satisfies Rules

// What may be reassigned.
const moduleSurface = {
  "eslint/no-param-reassign": "error",
  // `all`: a destructuring that reassigns any binding keeps `let`.
  "eslint/prefer-const": ["error", { destructuring: "all", ignoreReadBeforeAssign: true }],
} satisfies Rules

// Choices that are arbitrary alone and only pay off by being fixed.
const houseStyle = {
  "eslint/no-undef": "error",
  // Off: no-unused-vars asks for the _ prefix this rule forbids.
  "eslint/no-underscore-dangle": "off",
  "eslint/no-warning-comments": [
    "error",
    { location: "anywhere", terms: ["jscpd:ignore-start", "jscpd:ignore-end"] },
  ],
} satisfies Rules

export const eslintRules: OxlintConfig = defineConfig({
  rules: { ...failurePaths, ...cognitiveLoad, ...moduleSurface, ...houseStyle },
  overrides: [
    {
      files: testFiles,
      rules: {
        "eslint/max-depth": "off",
        "eslint/max-lines": "off",
        "eslint/max-lines-per-function": "off",
        "eslint/max-nested-callbacks": "off",
        "eslint/max-params": "off",
        "eslint/max-statements": "off",
      },
    },
  ],
})
