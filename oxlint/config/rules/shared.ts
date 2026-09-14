import type { OxlintConfig } from "oxlint"

export type Rule = Rules[string]
export type Rules = NonNullable<OxlintConfig["rules"]>

export const testFiles = ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/e2e/**"]
