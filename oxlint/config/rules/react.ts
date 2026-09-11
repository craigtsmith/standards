import { defineConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// The module graph: the automatic runtime imports React itself.
const moduleSurface = {
  "react/react-in-jsx-scope": "off",
} satisfies Rules

export const reactRules = defineConfig({ rules: { ...moduleSurface } })
