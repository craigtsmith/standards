import { defineConfig } from "oxlint"

import { testFiles, type Rules } from "./shared.ts"

// Safety: the perimeter. Past one of these the checker knows nothing.
const typeSystemSafety = {
  "typescript/no-explicit-any": "error",
  "typescript/no-non-null-asserted-nullish-coalescing": "error",
  "typescript/no-non-null-assertion": "error",
  "typescript/no-unsafe-argument": "error",
  "typescript/no-unsafe-assignment": "error",
  "typescript/no-unsafe-call": "error",
  "typescript/no-unsafe-enum-comparison": "error",
  "typescript/no-unsafe-function-type": "error",
  "typescript/no-unsafe-member-access": "error",
  "typescript/no-unsafe-return": "error",
  "typescript/no-unsafe-type-assertion": "error",
} satisfies Rules

// Precision: still checked, just looser than the code deserves.
const typeSystemPrecision = {
  "typescript/consistent-type-definitions": ["error", "interface"],
  "typescript/no-deprecated": "error",
  // The contracts pair an empty abstract class with an interface that only
  // extends; the option is typescript-eslint's own escape for that shape.
  "typescript/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
  "typescript/no-invalid-void-type": "error",
  "typescript/no-mixed-enums": "error",
  "typescript/no-namespace": "error",
  "typescript/no-unnecessary-boolean-literal-compare": "error",
  "typescript/no-unnecessary-condition": "error",
  "typescript/no-unnecessary-template-expression": "error",
  "typescript/no-unnecessary-type-arguments": "error",
  "typescript/no-unnecessary-type-assertion": "error",
  "typescript/no-unnecessary-type-constraint": "error",
  "typescript/no-unnecessary-type-conversion": "error",
  "typescript/no-unnecessary-type-parameters": "error",
  "typescript/prefer-literal-enum-member": "error",
  "typescript/prefer-reduce-type-parameter": "error",
} satisfies Rules

// The unhappy path: promises, await, throw and catch.
const failurePaths = {
  "typescript/no-misused-promises": "error",
  "typescript/only-throw-error": "error",
  "typescript/prefer-promise-reject-errors": "error",
} satisfies Rules

// Everything a reader must hold in their head to follow a function.
const cognitiveLoad = {
  // tsc's noImplicitReturns covers this with real control flow (the tsconfig preset).
  "typescript/consistent-return": "off",
  "typescript/no-unused-expressions": "error",
  "typescript/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  "typescript/no-useless-constructor": "error",
} satisfies Rules

// The surface a module presents: what it exports, imports and mutates.
const moduleSurface = {
  "typescript/no-array-constructor": "error",
  "typescript/no-dynamic-delete": "error",
  "typescript/no-extraneous-class": "error",
  "typescript/no-require-imports": "error",
  "typescript/prefer-return-this-type": "error",
  "typescript/related-getter-setter-pairs": "error",
  // On by default, so this line is load-bearing.
  "typescript/unbound-method": "off",
  "typescript/unified-signatures": "error",
  // Do not also set eslint/class-methods-use-this: the base rule's "off"
  // would win over this one through `extends`.
  "typescript/class-methods-use-this": [
    "error",
    {
      exceptMethods: ["routes"],
      ignoreClassesWithImplements: "public-fields",
      ignoreOverrideMethods: true,
    },
  ],
} satisfies Rules

export const typescriptRules = defineConfig({
  overrides: [
    {
      files: testFiles,
      rules: {
        "typescript/class-methods-use-this": "off",
        "typescript/no-explicit-any": "off",
        "typescript/no-extraneous-class": "off",
        "typescript/no-non-null-assertion": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-return": "off",
        "typescript/no-unsafe-type-assertion": "off",
      },
    },
  ],
  rules: {
    ...typeSystemSafety,
    ...typeSystemPrecision,
    ...failurePaths,
    ...cognitiveLoad,
    ...moduleSurface,
  },
})
