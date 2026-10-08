# oxfmt preset

`@craigts.dev/standards/oxfmt` exports `defineConfig`. Call it from `oxfmt.config.ts` in your project. You can give it your own options, or no options.

```ts
import { defineConfig } from "@craigts.dev/standards/oxfmt"

export default defineConfig()
```

## Options in the preset

| Option            | Value        | Reason                                              |
| ----------------- | ------------ | --------------------------------------------------- |
| `printWidth`      | `100`        | Same as the oxfmt default.                          |
| `tabWidth`        | `2`          | Same as the oxfmt default.                          |
| `endOfLine`       | `"lf"`       | Same as the oxfmt default.                          |
| `objectWrap`      | `"preserve"` | Same as the oxfmt default.                          |
| `singleQuote`     | `false`      | Same as the oxfmt default.                          |
| `sortPackageJson` | `true`       | Same as the oxfmt default.                          |
| `semi`            | `false`      | No semicolons.                                      |
| `trailingComma`   | `"es5"`      | The oxfmt default is `"all"`. See the next section. |

The preset sets the options that match the oxfmt defaults for two reasons. The `.editorconfig` file of a project cannot change them. A change to the oxfmt defaults does not reformat all projects.

### Trailing commas

With `"es5"`, oxfmt adds a trailing comma to multi-line arrays, objects and type parameter lists. It does not add one after function parameters or call arguments.

The preset has one override. It sets `trailingComma: "none"` for `**/*.jsonc` files, because many JSONC parsers do not accept a trailing comma.

### Ignored files

The preset ignores `**/dist`, `**/out`, `**/.astro`, `**/node_modules`, `**/.claude` and `**/pnpm-lock.yaml`. These are build output, generated files and files that other tools own.

## Merge rules

`defineConfig` adds your `ignorePatterns` and `overrides` to the lists of the preset. Each other option that you give replaces the value of the preset.

## Tailwind

`defineConfig` also accepts `sortTailwindcss`. This option enables the Tailwind class sort of oxfmt. If you do not give `sortTailwindcss`, oxfmt does not sort classes.

The preset sets `functions` to `["cn", "cva"]`. oxfmt then sorts the class strings in calls to those functions, and in `class` and `className` attributes. If you give `functions`, your list replaces the list of the preset.

## Example

```ts
import { defineConfig } from "@craigts.dev/standards/oxfmt"

export default defineConfig({
  printWidth: 120,
  ignorePatterns: ["src/generated"],
  overrides: [{ files: ["**/*.md"], options: { proseWrap: "always" } }],
  sortTailwindcss: { stylesheet: "./src/styles.css", functions: ["cn", "cva", "clsx"] },
})
```

This config has these results:

- `printWidth` is 120.
- oxfmt ignores `src/generated` and all the files that the preset ignores.
- The Markdown override applies, and the `.jsonc` override of the preset also applies.
- oxfmt sorts classes in calls to `cn`, `cva` and `clsx`.
