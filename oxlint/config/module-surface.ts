import { defineConfig } from "oxlint"

// The surface a module presents: what it exports, imports and mutates.
export const moduleSurfaceRules = defineConfig({
  plugins: [],
  rules: {
    // Classes and signatures. `eslint/class-methods-use-this` is this rule's
    // base name; through `extends` its "off" would win, so it is gone.
    "typescript/class-methods-use-this": [
      "error",
      {
        exceptMethods: ["routes"],
        ignoreClassesWithImplements: "public-fields",
        ignoreOverrideMethods: true,
      },
    ],
    "typescript/no-extraneous-class": "error",
    "typescript/prefer-return-this-type": "error",
    "typescript/unified-signatures": "error",
    "typescript/related-getter-setter-pairs": "error",
    "typescript/no-array-constructor": "error",
    "unicorn/no-static-only-class": "error",
    "unicorn/prefer-class-fields": "error",
    "standards/no-object-parameters": "error",
    "typescript/unbound-method": "off",

    // The module graph. fallow reports cycles too, with the full path; this
    // one is faster and works while editing, so both stay.
    "import/no-cycle": "error",
    "import/no-named-as-default": "error",
    "import/no-unassigned-import": "off",
    "typescript/no-require-imports": "error",
    "unicorn/prefer-node-protocol": "error",
    "react/react-in-jsx-scope": "off",

    // What may be reassigned, deleted or spread.
    "eslint/no-param-reassign": "error",
    // Upstream resets antfu's options by mistake; these are antfu's.
    "eslint/prefer-const": ["error", { destructuring: "all", ignoreReadBeforeAssign: true }],
    "typescript/no-dynamic-delete": "error",
    "standards/no-conditional-empty-object-spread": "error",
    "sonarjs/destructuring-assignment-syntax": "error",

    // Off, and off by default. Carried from agent-eslint-config.
    "typescript/consistent-type-imports": "off",
    "eslint/init-declarations": "off",
  },
})
