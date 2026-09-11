import { defineConfig } from "oxlint"

import type { Rules } from "./shared.ts"
import { sortClasses } from "./perfectionist/sort-classes.ts"
import { sortImports } from "./perfectionist/sort-imports.ts"
import { sortJsxProps } from "./perfectionist/sort-jsx-props.ts"
import { sortModules } from "./perfectionist/sort-modules.ts"

// Declaration order. Choices that are arbitrary alone and only pay off by being fixed.
const houseStyle = {
  "perfectionist/sort-classes": sortClasses,
  "perfectionist/sort-enums": ["error", { type: "natural" }],
  "perfectionist/sort-exports": ["error", { type: "natural" }],
  "perfectionist/sort-imports": sortImports,
  "perfectionist/sort-interfaces": ["error", { type: "natural" }],
  "perfectionist/sort-jsx-props": sortJsxProps,
  "perfectionist/sort-maps": ["error", { type: "natural" }],
  "perfectionist/sort-modules": sortModules,
  "perfectionist/sort-named-imports": "off",
  "perfectionist/sort-object-types": ["error", { type: "natural" }],
  "perfectionist/sort-sets": ["error", { type: "natural" }],
  "perfectionist/sort-objects": [
    "error",
    {
      newlinesBetween: 0,
      type: "natural",
      groups: [
        "property",
        "multiline-property",
        { newlinesBetween: 1 },
        "method",
        "multiline-method",
      ],
    },
  ],
} satisfies Rules

export const perfectionistRules = defineConfig({ rules: { ...houseStyle } })
