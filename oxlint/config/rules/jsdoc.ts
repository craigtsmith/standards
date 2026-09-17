import { defineConfig, type OxlintConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// A tag is optional, and wrong once written. Nothing here demands a tag exist,
// so `require-param`, `require-returns`, `require-property` and `require-yields`
// are absent. The rules the port does not carry are in `jsdoc-js.ts`.
const contract = {
  "jsdoc/check-access": "error",
  "jsdoc/check-property-names": "error",
  // Off: the port's tag list predates TSDoc and rejects `@remarks`, so
  // `jsdoc-js/check-tag-names` does this one.
  "jsdoc/check-tag-names": "off",
  "jsdoc/empty-tags": "error",
  "jsdoc/implements-on-classes": "error",
  "jsdoc/no-blank-blocks": "error",
  "jsdoc/no-defaults": "error",
  "jsdoc/require-param-description": "error",
  "jsdoc/require-param-name": "error",
  // Off, and load-bearing: the correctness category enables these three, so
  // leaving them out would still demand a tag. `require-property-type` also
  // wants the type `jsdoc-js/no-types` says TypeScript already states.
  "jsdoc/require-property": "off",
  "jsdoc/require-property-description": "error",
  "jsdoc/require-property-name": "error",
  "jsdoc/require-property-type": "off",
  "jsdoc/require-returns-description": "error",
  "jsdoc/require-throws-description": "error",
  "jsdoc/require-yields": "off",
  "jsdoc/require-yields-description": "error",
} satisfies Rules

export const jsdocRules: OxlintConfig = defineConfig({ rules: { ...contract } })
