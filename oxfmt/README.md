# oxfmt preset

`@craigts.dev/standards/oxfmt` exports `defineConfig`. A consumer's `oxfmt.config.ts` calls it with its own options, or with nothing.

```ts
// oxfmt.config.ts
import { defineConfig } from "@craigts.dev/standards/oxfmt"

export default defineConfig()
```

## Base options

- `printWidth: 100`, `tabWidth: 2`, `endOfLine: "lf"`, `objectWrap: "preserve"`, `sortPackageJson: true`, `singleQuote: false`. These match oxfmt's defaults. They are set so a project's `.editorconfig` cannot change them, and so a change in oxfmt's defaults does not reformat every consumer.
- `semi: false`. No semicolons.
- `trailingComma: "es5"`. Trailing commas in multi-line arrays, objects and type parameter lists. None after function parameters or call arguments. oxfmt's default is `"all"`.
- `overrides`: `trailingComma: "none"` for `**/*.jsonc`. Many JSONC parsers reject a trailing comma.
- `ignorePatterns`: `**/dist`, `**/out`, `**/.astro`, `**/node_modules`, `**/.claude`, `**/pnpm-lock.yaml`. Build output, generated files and files other tools own.

## Merging

`ignorePatterns` and `overrides` are appended to the base lists. Every other option replaces the base value.

## Tailwind

`defineConfig` also accepts `sortTailwindcss`, which turns on oxfmt's Tailwind class sorting. The preset defaults its `functions` to `["cn", "cva"]`, so class strings passed to those helpers are sorted as well as `class` and `className` attributes. Passing `functions` replaces that list. Without `sortTailwindcss` the sort stays off.

## Example

```ts
// oxfmt.config.ts
import { defineConfig } from "@craigts.dev/standards/oxfmt"

export default defineConfig({
  printWidth: 120,
  ignorePatterns: ["src/generated"],
  overrides: [{ files: ["**/*.md"], options: { proseWrap: "always" } }],
  sortTailwindcss: { stylesheet: "./src/styles.css", functions: ["cn", "cva", "clsx"] },
})
```

`printWidth` replaces the base value. `src/generated` joins the base ignore list. The Markdown override joins the `.jsonc` override.
