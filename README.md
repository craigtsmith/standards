# @craigts.dev/standards

oxlint, oxfmt, fallow and tsconfig presets for craigts.dev projects, plus the `standards` oxlint JS plugin.

## Requirements

- Node 22.14 or later.
- TypeScript 6.0 or later. See `tsconfig/README.md` for why.

## Install

```sh
pnpm add -D @craigts.dev/standards oxlint @oxlint/plugins oxlint-tsgolint oxfmt
```

`oxlint`, `@oxlint/plugins`, `oxlint-tsgolint` and `oxfmt` are peer dependencies. The plugin rules run inside your oxlint. The preset turns on type-aware linting, which oxlint delegates to `oxlint-tsgolint`. `fallow` is an optional peer; add it if you use the fallow preset.

## oxlint

```ts
// oxlint.config.ts
import { defineConfig } from "@craigts.dev/standards/oxlint"

export default defineConfig()
```

`defineConfig` takes your additions and merges them over the base. See [`oxlint/README.md`](oxlint/README.md) for the layout and merge rules, and [`docs/rules/README.md`](docs/rules/README.md) for the `standards` plugin rules.

## oxfmt

```ts
// oxfmt.config.ts
import { defineConfig } from "@craigts.dev/standards/oxfmt"

export default defineConfig()
```

`defineConfig` takes any oxfmt option. Your `ignorePatterns` and `overrides` are appended to the base lists. It also accepts `sortTailwindcss`, which sorts Tailwind classes and defaults `functions` to `["cn", "cva"]`:

```ts
export default defineConfig({ sortTailwindcss: { stylesheet: "./src/styles.css" } })
```

See [`oxfmt/README.md`](oxfmt/README.md) for each base option and the merge rules.

## fallow

In `.fallowrc.json`:

```json
{
  "$schema": "./node_modules/fallow/schema.json",
  "extends": ["npm:@craigts.dev/standards/fallow/preset.jsonc"]
}
```

fallow resolves an `npm:` subpath as a file inside the package, so the specifier names the file. [`fallow/README.md`](fallow/README.md) lists the rules and thresholds the preset sets and how to override them.

## tsconfig

In `tsconfig.json`:

```json
{
  "extends": [
    "@craigts.dev/standards/tsconfig/base.json",
    "@craigts.dev/standards/tsconfig/node.json"
  ],
  "include": ["src"]
}
```

The presets are composable. [`tsconfig/README.md`](tsconfig/README.md) lists each file, the order to extend them in, and worked examples.

## Exports

| Export                                       | Use                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| `@craigts.dev/standards/oxlint`              | `defineConfig` for `oxlint.config.ts`; see `oxlint/README.md`                           |
| `@craigts.dev/standards/oxlint/plugin`       | the `standards` JS plugin, loaded by the preset                                         |
| `@craigts.dev/standards/oxfmt`               | `defineConfig` for `oxfmt.config.ts`; see `oxfmt/README.md`                             |
| `@craigts.dev/standards/fallow/preset.jsonc` | `"extends": ["npm:@craigts.dev/standards/fallow/preset.jsonc"]`; see `fallow/README.md` |
| `@craigts.dev/standards/tsconfig/*.json`     | composable tsconfig presets; see `tsconfig/README.md`                                   |

The JavaScript `exports` point at `dist/`. oxlint and oxfmt load their config through Node, and Node will not type-strip `.ts` under `node_modules`.

## Development

This repo consumes its own presets through the same specifiers, so a change is checked here before any consumer updates. Those specifiers resolve to `dist/`, so `pnpm lint` builds first. `pnpm format` and `pnpm typecheck` need a build to exist.

Releases are cut by release-please and staged on npm for approval. See [`RELEASING.md`](RELEASING.md).

## Licence

MIT
