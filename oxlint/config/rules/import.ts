import { defineConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// The module graph.
const moduleSurface = {
  // fallow reports cycles too, with the full path; this one is faster and
  // works while editing, so both stay.
  "import/no-cycle": "error",
  "import/no-named-as-default": "error",
  // On by default, so this line is load-bearing.
  "import/no-unassigned-import": "off",
} satisfies Rules

export const importRules = defineConfig({ rules: { ...moduleSurface } })
