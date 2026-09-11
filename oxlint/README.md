# oxlint preset

`@craigts.dev/standards/oxlint` exports `defineConfig`. A consumer's `oxlint.config.ts` calls it with its own additions, or with nothing.

```ts
import { defineConfig } from "@craigts.dev/standards/oxlint"

export default defineConfig()
```

## Layout

- `config/index.ts` — the base: categories, env, plugins, JS plugins, ignore patterns, and the env-only overrides for config, script and test files. Exports `defineConfig`.
- `config/rules/<plugin>.ts` — one file per plugin, named after the rule prefix. Inside, one `const` per theme (`typeSystem`, `failurePaths`, `cognitiveLoad`, `moduleSurface`, `houseStyle`, `security`, `testing`) spread into the exported fragment. A rule relaxation for test or declaration files lives in the file of the plugin it relaxes.
- `config/rules/perfectionist/<rule>.ts` — the four option objects too long to read inline, each beside the `.probe.ts` file that exercises it.
- `plugin/` — the `standards` JS plugin: `plugin/rules/<rule>.ts` and the shared `plugin/rules/lib/`, layered as `ast/` (imports nothing internal), `types/` (imports `ast/`) and `widening/` (imports both).

## Reading a rule

The prefix in a diagnostic is the file: `sonarjs(no-nested-conditional)` is in `config/rules/sonarjs.ts`. eslint core rules print without a prefix.

A rule absent from every file can still be on. `categories` in `config/index.ts` enables every built-in rule tagged correctness, perf or suspicious. `oxlint --print-config` prints the resolved set. JS plugin rules (`perfectionist`, `sonarjs`, `standards`) are on only when a file lists them.

An `"off"` entry is load-bearing only when a category would otherwise enable the rule. Each such entry says so. Check a new one with `--print-config` before and after.

## Merging

oxlint's `extends` merges `rules`, `overrides` and `plugins` from every extended config. It replaces `env`, `ignorePatterns` and `settings` with the consumer's. `defineConfig` spreads those three so the base values survive; anything else the consumer passes goes through untouched.

## Probes

`config/rules/perfectionist/*.probe.ts` are linted like any other file. Reorder members in one and `pnpm lint` should report it. They import nothing and nothing imports them, so fallow lists them as unused files. That is expected.
