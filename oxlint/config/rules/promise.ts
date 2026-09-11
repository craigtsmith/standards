import { defineConfig } from "oxlint"

import type { Rules } from "./shared.ts"

// The unhappy path: promises and await.
const failurePaths = {
  "promise/always-return": ["warn", { ignoreLastCallback: true }],
  "promise/prefer-await-to-then": "error",
} satisfies Rules

export const promiseRules = defineConfig({ rules: { ...failurePaths } })
