import { defineConfig } from "vitest/config"

// This file also tells fallow's vitest plugin that the tests here are reachable.
export default defineConfig({ test: { include: ["oxlint/**/*.test.ts"] } })
