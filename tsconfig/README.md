# tsconfig presets

This directory holds the tsconfig presets of `@craigts.dev/standards`. Each preset is a small JSON file that sets a few options. A project combines presets in the `extends` array of its `tsconfig.json`.

## Requirements

- TypeScript 6.0 or later.
- `@types/node` for `node.json`.
- `@types/bun` for `bun.json`.

TypeScript 6.0 added `es2025` as a value for `target` and `lib`. Earlier versions reject the presets because of this value.

## Pick your presets

The order in `extends` is important. If two presets set the same option, the preset later in the array wins.

1. Put `base.json` first. Every project uses it.
2. Add one runtime preset: `dom.json`, `node.json` or `bun.json`.
3. If the project uses React, use `react.json` in place of `dom.json`.
4. If the project needs an output preset from the table, add it last.

| If the project                                                         | Add                |
| ---------------------------------------------------------------------- | ------------------ |
| uses tsc to emit the JavaScript                                        | `tsc.json`         |
| is a package that other people install from npm                        | `library.json`     |
| is a monorepo package that other packages use through its built output | `references.json`  |
| is a script that Node runs without a build                             | `strip-types.json` |

Without an output preset, `base.json` sets `noEmit`, and a bundler emits the JavaScript. A monorepo package that exports its `.ts` source does not need `references.json`.

## Examples

Each example is the full `tsconfig.json` of a project.

### Vite + React app

```json
{
  "extends": [
    "@craigts.dev/standards/tsconfig/base.json",
    "@craigts.dev/standards/tsconfig/react.json"
  ],
  "compilerOptions": { "types": ["vite/client"] },
  "include": ["src"]
}
```

### Node service built by a bundler such as tsdown or esbuild

```json
{
  "extends": [
    "@craigts.dev/standards/tsconfig/base.json",
    "@craigts.dev/standards/tsconfig/node.json"
  ],
  "include": ["src"]
}
```

### Published package built by tsdown

```json
{
  "extends": [
    "@craigts.dev/standards/tsconfig/base.json",
    "@craigts.dev/standards/tsconfig/node.json",
    "@craigts.dev/standards/tsconfig/library.json"
  ],
  "include": ["src"]
}
```

### Published package emitted by tsc in a `tsc --build` monorepo

```json
{
  "extends": [
    "@craigts.dev/standards/tsconfig/base.json",
    "@craigts.dev/standards/tsconfig/node.json",
    "@craigts.dev/standards/tsconfig/tsc.json",
    "@craigts.dev/standards/tsconfig/library.json",
    "@craigts.dev/standards/tsconfig/references.json"
  ],
  "include": ["src"]
}
```

### Script that Node runs without a build

```json
{
  "extends": [
    "@craigts.dev/standards/tsconfig/base.json",
    "@craigts.dev/standards/tsconfig/node.json",
    "@craigts.dev/standards/tsconfig/strip-types.json"
  ],
  "include": ["src"]
}
```

### Electron app with main, preload and renderer code in one project

`react.json` gives the DOM types, and `"types": ["node"]` adds the Node globals. The example does not use `node.json`, because the `lib` value of `node.json` removes the DOM types.

```json
{
  "extends": [
    "@craigts.dev/standards/tsconfig/base.json",
    "@craigts.dev/standards/tsconfig/react.json"
  ],
  "compilerOptions": { "types": ["node"] },
  "include": ["src"]
}
```

## What each preset sets

### base.json

`base.json` assumes that a bundler (Vite, tsdown, esbuild or Bun) emits the JavaScript. tsc only checks the types. `tsc.json` changes this.

| Option                               | Value      |
| ------------------------------------ | ---------- |
| `target`                             | `es2025`   |
| `moduleDetection`                    | `force`    |
| `module`                             | `preserve` |
| `noEmit`                             | `true`     |
| `rewriteRelativeImportExtensions`    | `true`     |
| `resolveJsonModule`                  | `true`     |
| `verbatimModuleSyntax`               | `true`     |
| `isolatedModules`                    | `true`     |
| `types`                              | `[]`       |
| `strict`                             | `true`     |
| `exactOptionalPropertyTypes`         | `true`     |
| `noUncheckedIndexedAccess`           | `true`     |
| `noPropertyAccessFromIndexSignature` | `true`     |
| `noImplicitOverride`                 | `true`     |
| `noImplicitReturns`                  | `true`     |
| `noFallthroughCasesInSwitch`         | `true`     |
| `noUncheckedSideEffectImports`       | `true`     |
| `allowUnreachableCode`               | `false`    |
| `allowUnusedLabels`                  | `false`    |
| `skipLibCheck`                       | `true`     |

`base.json` does not report unused variables or parameters. The oxlint preset reports them with `typescript/no-unused-vars`. This rule ignores names that start with `_`.

### dom.json

`dom.json` sets `lib` to `["es2025", "dom"]`.

### node.json

`node.json` sets `lib` to `["es2025"]` and `types` to `["node"]`. The project needs `@types/node`.

### bun.json

`bun.json` sets `lib` to `["esnext"]` and `types` to `["bun"]`. The project needs `@types/bun`. Do not combine it with `tsc.json` or `strip-types.json`.

### react.json

`react.json` extends `dom.json` and sets `jsx` to `react-jsx`.

### tsc.json

`tsc.json` makes tsc emit the JavaScript.

| Option      | Value               |
| ----------- | ------------------- |
| `module`    | `nodenext`          |
| `noEmit`    | `false`             |
| `rootDir`   | `${configDir}/src`  |
| `outDir`    | `${configDir}/dist` |
| `sourceMap` | `true`              |

If the source of the project is not in `src`, set `rootDir` and `outDir` in the project `tsconfig.json`.

### library.json

`library.json` is for a package that other people install.

| Option                 | Value  |
| ---------------------- | ------ |
| `declaration`          | `true` |
| `declarationMap`       | `true` |
| `isolatedDeclarations` | `true` |

With `base.json`, `noEmit` is `true`, and these options only check the code. If you add `tsc.json`, tsc emits the `.d.ts` files.

### references.json

`references.json` is for a monorepo package that other packages use through its built output. `tsc --build` needs to know the project graph.

| Option            | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| `composite`       | `true`                                                |
| `incremental`     | `true`                                                |
| `declarationMap`  | `true`                                                |
| `tsBuildInfoFile` | `${configDir}/node_modules/.tmp/tsconfig.tsbuildinfo` |

If the monorepo packages export their `.ts` source through `exports` in `package.json`, the project does not need this preset.

### strip-types.json

`strip-types.json` is for `.ts` files that Node runs directly. Type stripping is on by default since Node 23.6.0 and 22.18.0.

`erasableSyntaxOnly` makes TypeScript report syntax that Node cannot remove. This syntax includes enums, namespaces with runtime code, parameter properties, `import =`, `export =` and `<T>` type assertions.

Node also rejects decorators and `.tsx` files. `erasableSyntaxOnly` does not report decorators.

Node needs the file extension in each relative import. The `bundler` resolution from `base.json` does not report a missing extension. Write the `.ts` extension in each relative import.

## What stays with your project

The presets do not set these options. Set them in the project `tsconfig.json`:

- `include` and `exclude`.
- `paths`.
- More `types`, for example `vite/client`. A `types` value in the project replaces the preset value. For a Node project, write `["node", "vite/client"]`.
- `jsxImportSource`, for a JSX runtime other than React.
- `experimentalDecorators` and `emitDecoratorMetadata`, for a dependency injection container that reads constructor metadata.

## Editor support

TypeScript 7.0 ships no `tsserver.js`. When the project has no `tsserver.js`, vtsls uses its bundled TypeScript 5.9. TypeScript 5.9 rejects `es2025`, so the editor shows errors in these presets. Use a language server that runs TypeScript 7, for example `tsc --lsp` or the tsgo extension for Zed.
