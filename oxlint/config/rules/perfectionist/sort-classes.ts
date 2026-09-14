import type { Rule } from "../shared.ts"

// Probed by ./sort-classes.probe.ts.
export const sortClasses: Rule = [
  "error",
  {
    newlinesBetween: 1,
    type: "natural",
    groups: [
      "index-signature",

      // Contract first: what a subclass must implement, packed.
      { group: "protected-abstract-property", newlinesInside: 0 },
      { newlinesBetween: 0 },
      { group: "abstract-property", newlinesInside: 0 },
      { group: "protected-abstract-method", newlinesInside: 0 },
      { newlinesBetween: 0 },
      { group: "abstract-method", newlinesInside: 0 },

      // Then the shape, packed: private, protected, then public, static before
      // instance, and readonly first within each.
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

      // Then construction.
      "static-block",
      "constructor",

      // Then accessors, each getter beside its setter, packed.
      ["private-static-get-method", "private-static-set-method"],
      ["private-get-method", "private-set-method"],
      ["protected-static-get-method", "protected-static-set-method"],
      ["protected-get-method", "protected-set-method"],
      ["static-get-method", "static-set-method"],
      ["get-method", "set-method"],

      // Then static behaviour, private first.
      { group: "private-static-optional-method", newlinesInside: 0 },
      { group: "private-static-method", newlinesInside: 1 },
      "private-static-function-property",
      { group: "protected-static-optional-method", newlinesInside: 0 },
      { group: "protected-static-method", newlinesInside: 1 },
      "protected-static-function-property",
      { group: "static-optional-method", newlinesInside: 0 },
      { group: "static-method", newlinesInside: 1 },
      "static-function-property",

      // Then instance behaviour, public first.
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
]
