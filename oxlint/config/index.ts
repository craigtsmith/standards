import { defineConfig } from "oxlint"

import { cognitiveLoadRules } from "./cognitive-load.ts"
import { failurePathsRules } from "./failure-paths.ts"
import { houseStyleRules } from "./house-style.ts"
import { moduleSurfaceRules } from "./module-surface.ts"
import { securityRules } from "./security.ts"
import { testingRules } from "./testing.ts"
import { typeSystemRules } from "./type-system.ts"

export default defineConfig({
  plugins: [
    "typescript",
    "oxc",
    "unicorn",
    "import",
    "react",
    "jsx-a11y",
    "promise",
    "node",
    "vitest",
    "jsdoc",
  ],
  jsPlugins: [
    "@craigts.dev/standards/oxlint/plugin",
    "eslint-plugin-perfectionist",
    "eslint-plugin-sonarjs",
  ],
  categories: { correctness: "error", suspicious: "warn", perf: "warn" },
  options: { typeAware: true },
  extends: [
    typeSystemRules,
    failurePathsRules,
    cognitiveLoadRules,
    moduleSurfaceRules,
    houseStyleRules,
    securityRules,
    testingRules,
  ],
})
