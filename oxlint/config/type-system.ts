import { defineConfig } from "oxlint"

// Where TypeScript stops checking, and where it checks something vague.
export const typeSystemRules = defineConfig({
  plugins: [],
  rules: {
    // Safety: the perimeter. Past one of these the checker knows nothing.
    "typescript/no-explicit-any": "error",
    "typescript/no-unsafe-argument": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-call": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/no-unsafe-return": "error",
    "typescript/no-unsafe-function-type": "error",
    "typescript/no-unsafe-enum-comparison": "error",
    "typescript/no-unsafe-type-assertion": "error",
    "typescript/no-non-null-assertion": "error",
    "typescript/no-non-null-asserted-nullish-coalescing": "error",
    "standards/no-chained-type-assertions": "error",
    "standards/no-widen-then-assert": "error",
    "standards/require-safety-comment-for-type-assertion": "error",
    "standards/no-known-value-widening": "error",
    "standards/no-unknown-parameters": "error",
    "standards/no-unknown-returns": "error",
    "standards/no-unknown-type-aliases": "error",
    "standards/no-unsafe-dictionary-type": "error",
    // A type predicate is where a typeof check becomes a contract, so it is allowed there.
    "standards/no-runtime-typeof": ["error", { allowInTypeGuards: true }],
    "sonarjs/prefer-type-guard": "error",
    "standards/no-reflect-apply": "error",
    "standards/no-reflect-get": "error",
    "unicorn/no-instanceof-builtins": "error",

    // Precision: still checked, just looser than the code deserves.
    "typescript/no-unnecessary-type-arguments": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/no-unnecessary-type-constraint": "error",
    "typescript/no-unnecessary-type-conversion": "error",
    "typescript/no-unnecessary-type-parameters": "error",
    "typescript/no-unnecessary-condition": "error",
    "typescript/no-unnecessary-boolean-literal-compare": "error",
    "typescript/no-unnecessary-template-expression": "error",
    // The contracts pair an empty abstract class with an interface that only
    // extends; the option is typescript-eslint's own escape for that shape.
    "typescript/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
    "typescript/no-invalid-void-type": "error",
    "typescript/no-deprecated": "error",
    "typescript/prefer-reduce-type-parameter": "error",
    "typescript/consistent-type-definitions": ["error", "interface"],
    "typescript/no-mixed-enums": "error",
    "typescript/prefer-literal-enum-member": "error",
    "typescript/no-namespace": "error",

    // Off, and off by default. Carried from agent-eslint-config.
    "typescript/no-confusing-void-expression": "off",
  },
})
