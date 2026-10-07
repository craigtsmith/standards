import {
  defineConfig as defineOxfmtConfig,
  type OxfmtConfig,
  type SortTailwindcssConfig,
} from "oxfmt"

const tailwindFunctions = ["cn", "cva"]

const base = defineOxfmtConfig({
  endOfLine: "lf",
  objectWrap: "preserve",
  overrides: [{ files: ["**/*.jsonc"], options: { trailingComma: "none" } }],
  printWidth: 100,
  semi: false,
  singleQuote: false,
  sortPackageJson: true,
  tabWidth: 2,
  trailingComma: "es5",
  ignorePatterns: [
    "**/dist",
    "**/out",
    "**/.astro",
    "**/node_modules",
    "**/.claude",
    "**/pnpm-lock.yaml",
  ],
})

interface StandardOxfmtConfig extends OxfmtConfig {
  sortTailwindcss?: SortTailwindcssConfig
}

export const defineConfig = ({
  sortTailwindcss,
  ...config
}: StandardOxfmtConfig = {}): OxfmtConfig => {
  const merged: OxfmtConfig = defineOxfmtConfig({
    ...base,
    ...config,
    ignorePatterns: [...base.ignorePatterns, ...(config.ignorePatterns ?? [])],
    overrides: [...base.overrides, ...(config.overrides ?? [])],
  })
  if (sortTailwindcss) merged.sortTailwindcss = { functions: tailwindFunctions, ...sortTailwindcss }
  return merged
}
