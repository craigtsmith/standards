import { defineConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// A doc block that is present must be complete.
const houseStyle = {
  "jsdoc/no-blank-blocks": "error",
  "jsdoc/require-param": "error",
  "jsdoc/require-param-description": "error",
  "jsdoc/require-param-name": "error",
  "jsdoc/require-property": "error",
  "jsdoc/require-property-description": "error",
  "jsdoc/require-property-name": "error",
  "jsdoc/require-returns": "error",
  "jsdoc/require-returns-description": "error",
  "jsdoc/require-throws-description": "error",
  "jsdoc/require-yields": "error",
  "jsdoc/require-yields-description": "error",
} satisfies Rules

export const jsdocRules = defineConfig({ rules: { ...houseStyle } })
