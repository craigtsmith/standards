import type { Rule } from "../shared.ts"

export const sortImports: Rule = [
  "error",
  {
    customGroups: [{ elementNamePattern: ["^react$", "^react-.+"], groupName: "react" }],
    newlinesBetween: 0,
    type: "natural",
    groups: [
      "react",
      "type-import",
      ["value-builtin", "value-external"],
      { newlinesBetween: 1 },
      "type-internal",
      "value-internal",
      ["type-parent", "type-sibling", "type-index"],
      ["value-parent", "value-sibling", "value-index"],
      { newlinesBetween: 1 },
      "value-side-effect",
      ["value-side-effect-style"],
      "ts-equals-import",
      "unknown",
      { newlinesBetween: 1 },
    ],
  },
]
