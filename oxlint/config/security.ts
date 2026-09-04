import { defineConfig } from "oxlint"

// Credentials in source, and the two ways to run a string.
export const securityRules = defineConfig({
  plugins: [],
  rules: {
    "sonarjs/no-hardcoded-ip": "error",
    "sonarjs/no-hardcoded-passwords": "error",
    "sonarjs/no-hardcoded-secrets": "error",
    "sonarjs/os-command": "error",
  },
})
