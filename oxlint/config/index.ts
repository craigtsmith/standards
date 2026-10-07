import { fileURLToPath } from "node:url"
import { defineConfig as defineOxlintConfig, type OxlintConfig } from "oxlint"

import { eslintRules } from "./rules/eslint.ts"
import { importRules } from "./rules/import.ts"
import { jsdocJsRules } from "./rules/jsdoc-js.ts"
import { jsdocRules } from "./rules/jsdoc.ts"
import { oxcRules } from "./rules/oxc.ts"
import { perfectionistRules } from "./rules/perfectionist.ts"
import { promiseRules } from "./rules/promise.ts"
import { reactRules } from "./rules/react.ts"
import { testFiles } from "./rules/shared.ts"
import { sonarjsRules } from "./rules/sonarjs.ts"
import { standardsRules } from "./rules/standards.ts"
import { typescriptRules } from "./rules/typescript.ts"
import { unicornRules } from "./rules/unicorn.ts"
import { vitestRules } from "./rules/vitest.ts"

const resolve = (spec: string) => fileURLToPath(import.meta.resolve(spec))

const base = defineOxlintConfig({
  // Each category switches on every built-in rule tagged with it, so the
  // rule files are not the whole list. `oxlint --print-config` is.
  categories: { correctness: "error", perf: "warn", suspicious: "warn" },
  env: { browser: true, es2025: true },
  ignorePatterns: ["**/dist", "**/out", "**/.astro", "**/node_modules", "**/.claude"],
  options: { typeAware: true },
  // One file per plugin, in the order the rule prefixes sort.
  extends: [
    eslintRules,
    importRules,
    jsdocJsRules,
    jsdocRules,
    oxcRules,
    perfectionistRules,
    promiseRules,
    reactRules,
    sonarjsRules,
    standardsRules,
    typescriptRules,
    unicornRules,
    vitestRules,
  ],
  jsPlugins: [
    "@craigts.dev/standards/oxlint/plugin",
    // oxlint reserves `jsdoc` for its native port, so this plugin runs as `jsdoc-js`.
    { name: "jsdoc-js", specifier: resolve("eslint-plugin-jsdoc") },
    resolve("eslint-plugin-perfectionist"),
    resolve("eslint-plugin-sonarjs"),
  ],
  overrides: [
    { env: { node: true }, files: ["**/*.config.{ts,mts,js,mjs}", "**/scripts/**"] },
    { env: { node: true }, files: testFiles },
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

// `extends` replaces env and ignorePatterns with the consumer's, so these spreads keep the base's.
export const defineConfig = (config: OxlintConfig = {}): OxlintConfig =>
  defineOxlintConfig({
    ...config,
    env: { ...base.env, ...config.env },
    extends: [base, ...(config.extends ?? [])],
    ignorePatterns: [...base.ignorePatterns, ...(config.ignorePatterns ?? [])],
  })
