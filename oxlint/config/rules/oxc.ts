import { defineConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// The unhappy path: throw.
const failurePaths = {
  // Off: sonarjs/no-unthrown-error is broader.
  "oxc/missing-throw": "off",
} satisfies Rules

export const oxcRules = defineConfig({ rules: { ...failurePaths } })
