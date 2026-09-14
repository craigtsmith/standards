# standards

oxlint, oxfmt, fallow and tsconfig presets for craigts.dev projects. Not published; consumed as a git dependency.

```jsonc
// package.json
"devDependencies": { "@craigts.dev/standards": "github:craigtsmith/standards#main" }
```

`exports` points at `dist/`, which `pnpm build` (tsc, `tsconfig.build.json`) emits and `prepare` runs on install. Node will not type-strip `.ts` under `node_modules`, and oxlint and oxfmt load their config through Node, so the package has to ship JavaScript. `oxlint`, `@oxlint/plugins` and `oxfmt` are peer dependencies: the plugin rules run inside the consumer's oxlint.

| Export                                   | Use                                                           |
| ---------------------------------------- | ------------------------------------------------------------- |
| `@craigts.dev/standards/oxlint`          | `defineConfig` for `oxlint.config.ts`; see `oxlint/README.md` |
| `@craigts.dev/standards/oxlint/plugin`   | the `standards` JS plugin, loaded by the preset               |
| `@craigts.dev/standards/oxfmt`           | `defineConfig` for `oxfmt.config.ts`                          |
| `@craigts.dev/standards/fallow.jsonc`    | `"extends": ["npm:@craigts.dev/standards/fallow.jsonc"]`      |
| `@craigts.dev/standards/tsconfig/*.json` | composable tsconfig presets; see `tsconfig/README.md`         |

This repo consumes its own presets through the same specifiers, so a change is checked here before any consumer updates.
