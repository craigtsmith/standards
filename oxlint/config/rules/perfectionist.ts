import { defineConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// Declaration order. Choices that are arbitrary alone and only pay off by being fixed.
const houseStyle = {
  "perfectionist/sort-imports": [
    "error",
    {
      type: "natural",
      newlinesBetween: 0,
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
      customGroups: [{ groupName: "react", elementNamePattern: ["^react$", "^react-.+"] }],
    },
  ],
  "perfectionist/sort-exports": ["error", { type: "natural" }],
  "perfectionist/sort-named-imports": "off",
  "perfectionist/sort-modules": [
    "error",
    {
      type: "unsorted",
      newlinesBetween: 1,
      newlinesInside: "ignore",
      groups: [
        // types first — public before local
        "export-enum",
        "export-interface",
        "export-type",
        ["declare-enum", "enum"],
        ["declare-interface", "interface"],
        ["declare-type", "type"],

        // implementation — public first, helpers last
        { group: "export-class", newlinesInside: 1 },
        { group: "export-default-class", newlinesInside: 1 },
        { group: "export-function", newlinesInside: 1 },
        { group: "export-default-function", newlinesInside: 1 },
        { group: "declare-class", newlinesInside: 1 },
        { group: "class", newlinesInside: 1 },
        { group: "declare-function", newlinesInside: 1 },
        { group: "function", newlinesInside: 1 },
        { group: "unknown", newlinesInside: 1 },
      ],
    },
  ],
  "perfectionist/sort-classes": [
    "error",
    {
      type: "natural",
      newlinesBetween: 1,
      groups: [
        "index-signature",

        // 1. contract — what subclasses must implement (all packed)
        { group: "protected-abstract-property", newlinesInside: 0 },
        { newlinesBetween: 0 },
        { group: "abstract-property", newlinesInside: 0 },
        { group: "protected-abstract-method", newlinesInside: 0 },
        { newlinesBetween: 0 },
        { group: "abstract-method", newlinesInside: 0 },

        // 2. shape — packed, readonly first within each bucket,
        //    private → protected → public, static before instance
        "private-static-readonly-property",
        { newlinesBetween: 0 },
        ["private-static-property", "private-static-accessor-property"],
        "private-readonly-property",
        { newlinesBetween: 0 },
        ["private-property", "private-accessor-property"],
        "protected-static-readonly-property",
        { newlinesBetween: 0 },
        ["protected-static-property", "protected-static-accessor-property"],
        "protected-readonly-property",
        { newlinesBetween: 0 },
        ["protected-property", "protected-accessor-property"],
        "static-readonly-property",
        { newlinesBetween: 0 },
        ["static-property", "static-accessor-property"],
        "readonly-property",
        { newlinesBetween: 0 },
        ["property", "accessor-property"],

        // 3. construction
        "static-block",
        "constructor",

        // 4. computed access — pairs adjacent, packed
        ["private-static-get-method", "private-static-set-method"],
        ["private-get-method", "private-set-method"],
        ["protected-static-get-method", "protected-static-set-method"],
        ["protected-get-method", "protected-set-method"],
        ["static-get-method", "static-set-method"],
        ["get-method", "set-method"],

        // 5a. behavior — class functions
        { group: "private-static-optional-method", newlinesInside: 0 },
        { group: "private-static-method", newlinesInside: 1 },
        "private-static-function-property",
        { group: "protected-static-optional-method", newlinesInside: 0 },
        { group: "protected-static-method", newlinesInside: 1 },
        "protected-static-function-property",
        { group: "static-optional-method", newlinesInside: 0 },
        { group: "static-method", newlinesInside: 1 },
        "static-function-property",

        // 5b. behavior — instance functions
        { group: "optional-method", newlinesInside: 0 },
        { group: "method", newlinesInside: 1 },
        "function-property",
        { group: "protected-optional-method", newlinesInside: 0 },
        { group: "protected-method", newlinesInside: 1 },
        "protected-function-property",
        { group: "private-optional-method", newlinesInside: 0 },
        { group: "private-method", newlinesInside: 1 },
        "private-function-property",
        "unknown",
      ],
    },
  ],
  "perfectionist/sort-enums": ["error", { type: "natural" }],
  "perfectionist/sort-interfaces": ["error", { type: "natural" }],
  "perfectionist/sort-object-types": ["error", { type: "natural" }],
  "perfectionist/sort-objects": [
    "error",
    {
      type: "natural",
      newlinesBetween: 0,
      groups: [
        "property",
        "multiline-property",
        { newlinesBetween: 1 },
        "method",
        "multiline-method",
      ],
    },
  ],
  "perfectionist/sort-jsx-props": [
    "error",
    {
      type: "natural",
      newlinesBetween: 0,
      newlinesInside: 0,
      groups: [
        "key",
        "ref",
        "id",
        ["className", "style"],
        ["aria-props", "data-props"],
        "shorthand-prop",
        "string-value",
        // plain expressions: numbers, vars, ternaries, template literals
        "unknown",
        "object-value",
        "jsx-value",
        "callback",
        "multiline-callback",
        "multiline-expression",
        "multiline-object-value",
        "multiline-jsx-value",
      ],
      customGroups: [
        { groupName: "key", elementNamePattern: "^key$" },
        { groupName: "ref", elementNamePattern: "^ref$" },
        { groupName: "id", elementNamePattern: "^id$" },
        { groupName: "className", elementNamePattern: "^className$" },
        { groupName: "style", elementNamePattern: "^style$" },
        { groupName: "aria-props", elementNamePattern: "^aria-" },
        { groupName: "data-props", elementNamePattern: "^data-" },
        {
          groupName: "multiline-callback",
          elementNamePattern: "^on[A-Z]",
          modifiers: ["multiline"],
        },
        { groupName: "callback", elementNamePattern: "^on[A-Z]" },
        {
          groupName: "multiline-jsx-value",
          elementValuePattern: "^\\{\\s*<",
          modifiers: ["multiline"],
        },
        { groupName: "jsx-value", elementValuePattern: "^\\{\\s*<" },
        {
          groupName: "multiline-object-value",
          elementValuePattern: "^\\{\\{",
          modifiers: ["multiline"],
        },
        { groupName: "object-value", elementValuePattern: "^\\{\\{" },
        { groupName: "string-value", elementValuePattern: "^[\"']" },
        { groupName: "multiline-expression", modifiers: ["multiline"] },
      ],
    },
  ],
  "perfectionist/sort-maps": ["error", { type: "natural" }],
  "perfectionist/sort-sets": ["error", { type: "natural" }],
} satisfies Rules

export const perfectionistRules = defineConfig({ rules: { ...houseStyle } })
