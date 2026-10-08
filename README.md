# @craigts.dev/standards

Shared presets for oxlint, oxfmt, fallow and TypeScript. The package also contains `standards`, an oxlint JS plugin with custom rules.

## Requirements

- Node 22.14 or later.
- TypeScript 6.0 or later.

## Install

```sh
pnpm add -D @craigts.dev/standards oxlint @oxlint/plugins oxlint-tsgolint oxfmt
```

`oxlint`, `@oxlint/plugins`, `oxlint-tsgolint` and `oxfmt` are peer dependencies. The plugin rules run inside the oxlint of your project. The oxlint preset enables type-aware linting, and oxlint uses `oxlint-tsgolint` for it.

`fallow` is an optional peer dependency. Install it if you use the fallow preset.

## oxlint

Create `oxlint.config.ts`:

```ts
import { defineConfig } from "@craigts.dev/standards/oxlint"

export default defineConfig()
```

`defineConfig` merges your rules and settings over the preset. [`oxlint/README.md`](oxlint/README.md) describes the preset and how to change it. [`docs/rules/README.md`](docs/rules/README.md) describes each rule of the `standards` plugin.

## oxfmt

Create `oxfmt.config.ts`:

```ts
import { defineConfig } from "@craigts.dev/standards/oxfmt"

export default defineConfig()
```

`defineConfig` accepts all oxfmt options. It adds your `ignorePatterns` and `overrides` to the lists of the preset. It also accepts `sortTailwindcss`, which sorts Tailwind classes:

```ts
import { defineConfig } from "@craigts.dev/standards/oxfmt"

export default defineConfig({ sortTailwindcss: { stylesheet: "./src/styles.css" } })
```

[`oxfmt/README.md`](oxfmt/README.md) lists each option of the preset and the merge rules.

## fallow

Create `.fallowrc.json`:

```json
{
  "$schema": "./node_modules/fallow/schema.json",
  "extends": ["npm:@craigts.dev/standards/fallow/preset.jsonc"]
}
```

The specifier must name the file. fallow reads an `npm:` path as a file inside the package. [`fallow/README.md`](fallow/README.md) lists the rules and thresholds of the preset and how to change them.

## tsconfig

Extend the presets in `tsconfig.json`:

```json
{
  "extends": [
    "@craigts.dev/standards/tsconfig/base.json",
    "@craigts.dev/standards/tsconfig/node.json"
  ],
  "include": ["src"]
}
```

The presets are small files that you combine. [`tsconfig/README.md`](tsconfig/README.md) tells you which files to use, the order, and why each option is set.

## Exports

| Export                                       | Use                                                    |
| -------------------------------------------- | ------------------------------------------------------ |
| `@craigts.dev/standards/oxlint`              | `defineConfig` for `oxlint.config.ts`                  |
| `@craigts.dev/standards/oxlint/plugin`       | The `standards` JS plugin. The oxlint preset loads it. |
| `@craigts.dev/standards/oxfmt`               | `defineConfig` for `oxfmt.config.ts`                   |
| `@craigts.dev/standards/fallow/preset.jsonc` | The fallow preset. Use it with `npm:` in `extends`.    |
| `@craigts.dev/standards/tsconfig/*.json`     | The tsconfig presets. Use them in `extends`.           |

The JavaScript exports point at `dist/`. oxlint and oxfmt load their config through Node, and Node does not remove types from `.ts` files in `node_modules`.

## Licence

MIT
