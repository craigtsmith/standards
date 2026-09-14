import type { Rule } from "../shared.ts"

export const sortJsxProps: Rule = [
  "error",
  {
    newlinesBetween: 0,
    newlinesInside: 0,
    type: "natural",
    customGroups: [
      { elementNamePattern: "^key$", groupName: "key" },
      { elementNamePattern: "^ref$", groupName: "ref" },
      { elementNamePattern: "^id$", groupName: "id" },
      { elementNamePattern: "^className$", groupName: "className" },
      { elementNamePattern: "^style$", groupName: "style" },
      { elementNamePattern: "^aria-", groupName: "aria-props" },
      { elementNamePattern: "^data-", groupName: "data-props" },
      {
        elementNamePattern: "^on[A-Z]",
        groupName: "multiline-callback",
        modifiers: ["multiline"],
      },
      { elementNamePattern: "^on[A-Z]", groupName: "callback" },
      {
        elementValuePattern: "^\\{\\s*<",
        groupName: "multiline-jsx-value",
        modifiers: ["multiline"],
      },
      { elementValuePattern: "^\\{\\s*<", groupName: "jsx-value" },
      {
        elementValuePattern: "^\\{\\{",
        groupName: "multiline-object-value",
        modifiers: ["multiline"],
      },
      { elementValuePattern: "^\\{\\{", groupName: "object-value" },
      { elementValuePattern: "^[\"']", groupName: "string-value" },
      { groupName: "multiline-expression", modifiers: ["multiline"] },
    ],
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
  },
]
