import { fileURLToPath } from "node:url"
import { defineConfig as defineOxlintConfig, type OxlintConfig } from "oxlint"

import { cognitiveLoadRules } from "./cognitive-load.ts"
import { failurePathsRules } from "./failure-paths.ts"
import { houseStyleRules } from "./house-style.ts"
import { moduleSurfaceRules } from "./module-surface.ts"
import { securityRules } from "./security.ts"
import { testingRules } from "./testing.ts"
import { typeSystemRules } from "./type-system.ts"

const resolve = (spec: string) => fileURLToPath(import.meta.resolve(spec))

const base = defineOxlintConfig({
  env: { browser: true, es2024: true },
  settings: { react: { version: "19.2" } },
  ignorePatterns: ["**/dist", "**/out", "**/.astro", "**/node_modules", "**/.claude"],
  categories: { correctness: "error", perf: "warn", suspicious: "warn" },
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
  jsPlugins: [
    "@craigts.dev/standards/oxlint/plugin",
    resolve("eslint-plugin-perfectionist"),
    resolve("eslint-plugin-sonarjs"),
  ],
  overrides: [
    { files: ["**/*.d.ts"], rules: { "sonarjs/no-redundant-assignments": "off" } },
    { env: { node: true }, files: ["**/*.config.{ts,mts,js,mjs}", "**/scripts/**"] },
    {
      env: { node: true },
      files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/e2e/**"],
      rules: {
        "eslint/max-depth": "off",
        "eslint/max-lines": "off",
        "eslint/max-lines-per-function": "off",
        "eslint/max-nested-callbacks": "off",
        "eslint/max-params": "off",
        "eslint/max-statements": "off",
        "typescript/class-methods-use-this": "off",
        "typescript/no-explicit-any": "off",
        "typescript/no-extraneous-class": "off",
        "typescript/no-non-null-assertion": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-return": "off",
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/require-await": "off",
        "typescript/unbound-method": "off",
      },
    },
  ],
  plugins: [
    "import",
    "jsdoc",
    "jsx-a11y",
    "node",
    "oxc",
    "promise",
    "react",
    "typescript",
    "unicorn",
    "vitest",
  ],
})

export const defineConfig = (config: OxlintConfig = {}): OxlintConfig =>
  defineOxlintConfig({
    ...config,
    env: { ...base.env, ...config.env },
    extends: [base, ...(config.extends ?? [])],
    ignorePatterns: [...base.ignorePatterns, ...(config.ignorePatterns ?? [])],
    settings: { ...base.settings, ...config.settings },
  })
