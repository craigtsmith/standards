import type { Rule } from "../shared.ts"

// Probed by ./sort-modules.probe.ts.
export const sortModules = [
  "error",
  {
    newlinesBetween: 1,
    newlinesInside: "ignore",
    type: "unsorted",
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
] satisfies Rule
