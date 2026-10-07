# oxlint preset

`@craigts.dev/standards/oxlint` exports `defineConfig`. A consumer's `oxlint.config.ts` calls it with its own additions, or with nothing.

```ts
import { defineConfig } from "@craigts.dev/standards/oxlint"

export default defineConfig()
```

## Layout

- `config/index.ts` — the base: categories, env, plugins, JS plugins, ignore patterns, and the env-only overrides for config, script and test files. Exports `defineConfig`.
- `config/rules/<plugin>.ts` — one file per plugin, named after the rule prefix. Inside, one `const` per theme (`typeSystem`, `failurePaths`, `cognitiveLoad`, `moduleSurface`, `houseStyle`, `security`, `testing`) spread into the exported fragment. A rule relaxation for test or declaration files lives in the file of the plugin it relaxes.
- `config/rules/shared.ts` — the `Rule` and `Rules` types and the `testFiles` globs the base and the plugin files share.
- `config/rules/jsdoc-js.ts` — the doc rules oxlint's native `jsdoc` port does not carry, from `eslint-plugin-jsdoc` under the alias `jsdoc-js`; oxlint reserves the `jsdoc` prefix. The port runs in Rust and is an order faster, so everything it carries stays in `jsdoc.ts` and nothing appears in both files.
- `config/rules/perfectionist/<rule>.ts` — the four option objects too long to read inline. `sort-classes.ts` and `sort-modules.ts` each sit beside a `.probe.ts` file that exercises them.
- `plugin/` — the `standards` JS plugin: one `plugin/rules/<rule>.ts` per rule, with its test beside it, and helpers the rules share in `plugin/rules/lib/`.

Each `standards` rule is documented in [`docs/rules/`](../docs/rules/README.md).

## Reading a rule

The prefix in a diagnostic is the file: `sonarjs(no-nested-conditional)` is in `config/rules/sonarjs.ts`. eslint core rules print without a prefix.

A rule absent from every file can still be on. `categories` in `config/index.ts` enables every built-in rule tagged correctness, perf or suspicious. `oxlint --print-config` prints the resolved set. JS plugin rules (`jsdoc-js`, `perfectionist`, `sonarjs`, `standards`) are on only when a file lists them.

An `"off"` entry is load-bearing only when a category would otherwise enable the rule. Each such entry says so. Check a new one with `--print-config` before and after.

## Comments and doc blocks

Two rules decide what a comment may be, and neither one asks for a tag.

`standards/max-comment-lines` carries three limits. `max`, three lines, is for an ordinary comment: a run of adjacent `//` lines counts as one, and a single blank line does not break the run; two do. A `/* */` block counts its own lines. Three lines is room for a real explanation, so prose has no reason to become a doc block.

`maxDoc`, fifteen lines, is for documentation: a well-formed `/** */` block sitting on a declaration the rule knows, that declaration exported or ambient. On an unexported declaration a tagless block is an ordinary comment and takes the three-line limit; a tag makes it documentation, and `@internal` is enough.

`maxHeader`, twenty lines, is for the file header: a well-formed block on line 1 before any token. A header sums up a module rather than one declaration, so it gets the longer count. A block on line 1 is always judged as the header, never as documentation for whatever follows it.

`jsdoc/*` and `jsdoc-js/*` govern what goes inside a block. No rule requires a tag. `/** Why this exists. */` on a function is complete: there is no `require-param`, `require-returns`, `require-property` or `require-yields`, and no `require-jsdoc`, so a function may carry no block at all. `require-property`, `require-property-type` and `require-yields` are `"off"` in `jsdoc.ts` rather than absent, because the correctness category would otherwise enable them.

What the block does carry has to hold up. `require-description` rejects a block of nothing but tags. `check-param-names` rejects a `@param` naming a parameter that does not exist, and duplicates, with `disableMissingParamChecks` so documenting one parameter does not oblige documenting the rest. `require-param-description` and `require-returns-description` reject a bare tag. `check-tag-names` rejects a tag that is not a tag, `empty-tags` a tag carrying content it should not, `no-types` a type in a `@param` that TypeScript already states. `check-tag-names` comes from the alias and the port's copy is `"off"`: the port's tag list predates TSDoc and rejects `@remarks`. `sort-tags` is off for the same reason.

`informative-docs` reports a description that only restates the name above it. It is a warning, because it compares a description's words with the name and can flag a short accurate description.

## Overriding

A consumer's `rules` take precedence over the preset's. A rule set with options replaces the preset's options for that rule in full. The preset sets no React version, so a project that needs one sets it in `settings`.

```ts
import { defineConfig } from "@craigts.dev/standards/oxlint"

export default defineConfig({
  rules: { "eslint/max-params": ["error", 4] },
  settings: { react: { version: "19" } },
})
```

## Merging

oxlint's `extends` merges `rules`, `overrides` and `plugins`, and replaces `env` and `ignorePatterns` with the consumer's. `defineConfig` merges those two with the base; anything else the consumer passes goes through as given.

## Tests

`pnpm test` runs vitest over `plugin/rules/*.test.ts`. Each rule has one test file beside it, driven by `RuleTester` from `oxlint/plugins-dev`, which lints in-process through oxlint's own bindings. `plugin/rules/rule-tester.ts` binds the tester to vitest and exports two instances: `ruleTester` parses as `ts`, `tsxRuleTester` as `tsx` for cases that hold JSX. Columns in an expected error are zero-based. An `errors` entry with `data` must name every placeholder the message uses.

## Probes

`config/rules/perfectionist/*.probe.ts` are linted like any other file. Reorder members in one and `pnpm lint` should report it. They import nothing and nothing imports them, so fallow lists them as unused files. That is expected.
