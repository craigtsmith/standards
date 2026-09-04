import { defineConfig } from "oxlint"

// Everything a reader must hold in their head to follow a function.
export const cognitiveLoadRules = defineConfig({
  plugins: [],
  rules: {
    // Control flow. The sonarjs entries run via rules/compat/sonarjs.ts.
    "sonarjs/no-nested-conditional": "error",
    "sonarjs/elseif-without-else": "error",
    "sonarjs/no-all-duplicated-branches": "error",
    "sonarjs/no-duplicated-branches": "error",
    "sonarjs/too-many-break-or-continue-in-loop": "error",
    "sonarjs/misplaced-loop-counter": "error",
    "sonarjs/updated-loop-counter": "error",
    "sonarjs/no-nested-assignment": "error",
    "sonarjs/no-nested-functions": "error",
    "sonarjs/no-nested-incdec": "off",
    // Off: unicorn/consistent-function-scoping below covers it, and allows
    // a block function that uses its closure.
    "sonarjs/no-function-declaration-in-block": "off",
    "unicorn/no-lonely-if": "error",
    "unicorn/consistent-function-scoping": "error",
    // tsc's noImplicitReturns covers this with real control flow (tsconfig.base.json).
    "typescript/consistent-return": "off",

    // Size budgets.
    "eslint/max-depth": ["error", 2],
    "eslint/max-lines": ["error", { max: 150, skipBlankLines: true, skipComments: true }],
    // fallow's health.maxUnitSize is 40 too, but counts blank and comment
    // lines and ignores a wider set of paths. Both stay.
    "eslint/max-lines-per-function": [
      "error",
      { max: 40, skipBlankLines: true, skipComments: true },
    ],
    "eslint/max-statements": ["error", 10],
    "eslint/max-nested-callbacks": ["error", 3],
    "eslint/max-params": ["error", 3],

    // Code that does nothing but still has to be read.
    "typescript/no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
    "typescript/no-unused-expressions": "error",
    "typescript/no-useless-constructor": "error",
    // Both stay. Neither subsumes the other: on one function they reported
    // different lines.
    "eslint/no-useless-assignment": "error",
    "sonarjs/no-redundant-assignments": "error",
    "sonarjs/no-useless-increment": "error",

    // Off, and off by default. Carried from agent-eslint-config.
    // sonarjs/no-nested-conditional rejects the nesting outright.
    "unicorn/no-nested-ternary": "off",
  },
})
