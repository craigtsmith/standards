/**
 * The doc rules oxlint's native `jsdoc` port does not carry, from `eslint-plugin-jsdoc`
 * under the alias `jsdoc-js`; oxlint reserves the `jsdoc` prefix. Everything the port
 * does carry stays in `jsdoc.ts`, where it runs in Rust. Nothing belongs in both files.
 */

import { defineConfig, type OxlintConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// A tag is optional, and wrong once written. Nothing here demands a tag exist.
const contract = {
  // The port's list predates TSDoc and rejects `@remarks`, so this replaces it.
  "jsdoc-js/check-tag-names": "error",
  "jsdoc-js/check-template-names": "error",
  "jsdoc-js/check-types": "error",
  "jsdoc-js/check-values": "error",
  // TypeScript already carries the type, and a second copy in the block goes stale.
  "jsdoc-js/no-types": "error",
  "jsdoc-js/reject-any-type": "error",
  "jsdoc-js/reject-function-type": "error",
  "jsdoc-js/require-returns-check": "error",
  "jsdoc-js/require-template-description": "error",
  "jsdoc-js/require-yields-check": "error",
  // Both options keep a tag optional. `checkDestructured` wants one per destructured
  // property, and the missing-param check turns one tag into a tag per parameter.
  "jsdoc-js/check-param-names": [
    "error",
    { checkDestructured: false, disableMissingParamChecks: true },
  ],
} satisfies Rules

// A block has to say something the signature does not.
const cognitiveLoad = {
  // Warning, not error: the fix is deleting a tag, and consumers have tags to
  // delete. Raise to error once they are gone.
  "jsdoc-js/informative-docs": "warn",
  "jsdoc-js/no-blank-block-descriptions": "error",
  // Prose is what a block is for. A block of nothing but tags is not one.
  "jsdoc-js/require-description": "error",
} satisfies Rules

// Choices that are arbitrary alone and only pay off by being fixed.
const houseStyle = {
  "jsdoc-js/check-alignment": "error",
  // Off: check-indentation rejects the hanging indent of a wrapped description,
  // which is the shape every formatter produces.
  "jsdoc-js/check-indentation": "off",
  "jsdoc-js/multiline-blocks": ["error", { noFinalLineText: true, noZeroLineText: true }],
  "jsdoc-js/no-bad-blocks": "error",
  "jsdoc-js/no-multi-asterisks": "error",
  "jsdoc-js/require-hyphen-before-param-description": "error",
  // Off: sort-tags' order predates TSDoc, so it sorts `@remarks` after `@param`
  // and fights the tag list check-tag-names accepts.
  "jsdoc-js/sort-tags": "off",
  // One blank line between the description and the tags, none between tags.
  "jsdoc-js/tag-lines": ["error", "never", { startLines: 1 }],
  "jsdoc-js/type-formatting": "error",
} satisfies Rules

export const jsdocJsRules: OxlintConfig = defineConfig({
  rules: { ...contract, ...cognitiveLoad, ...houseStyle },
})
