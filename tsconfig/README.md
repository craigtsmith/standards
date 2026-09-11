# tsconfig presets

Small files combined through an `extends` array. Later entries win, so list them in the order below. The files carry no comments; this page is the explanation.

1. `base.json` — always first. Strictness, `.ts` import specifiers, and a bundler/`noEmit` default.
2. One runtime: `dom.json`, `node.json` or `bun.json`. Sets `lib` and `types`.
3. Optional framework: `react.json` (includes `dom.json`).
4. Optional output: `tsc.json` when tsc emits; `library.json` for a published package; `references.json` for `tsc --build` graphs; `strip-types.json` when Node runs `.ts` directly.

```jsonc
// Vite + React app
{
  "extends": ["@craigts.dev/standards/tsconfig/base.json", "@craigts.dev/standards/tsconfig/react.json"],
  "compilerOptions": { "types": ["vite/client"] },
  "include": ["src"]
}

// Node service bundled by tsdown or esbuild
{
  "extends": ["@craigts.dev/standards/tsconfig/base.json", "@craigts.dev/standards/tsconfig/node.json"],
  "include": ["src"]
}

// Published package, built by tsdown
{
  "extends": [
    "@craigts.dev/standards/tsconfig/base.json",
    "@craigts.dev/standards/tsconfig/node.json",
    "@craigts.dev/standards/tsconfig/library.json"
  ],
  "include": ["src"]
}

// Published package, emitted by tsc, inside a tsc --build monorepo
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

// Script Node runs without a build step
{
  "extends": [
    "@craigts.dev/standards/tsconfig/base.json",
    "@craigts.dev/standards/tsconfig/node.json",
    "@craigts.dev/standards/tsconfig/strip-types.json"
  ],
  "include": ["src"]
}

// Electron: main, preload and renderer in one project. react.json plus Node
// globals, not node.json, whose lib would drop DOM.
{
  "extends": ["@craigts.dev/standards/tsconfig/base.json", "@craigts.dev/standards/tsconfig/react.json"],
  "compilerOptions": { "types": ["node"] },
  "include": ["src"]
}
```

## The axes

| Question                     | Preset                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| Browser or Node or Bun?      | `dom.json`, `node.json`, `bun.json`                                                     |
| React?                       | `react.json` in place of `dom.json`                                                     |
| Does tsc emit, or a bundler? | bundler is the default; add `tsc.json` for tsc                                          |
| Published to npm?            | `library.json`                                                                          |
| Monorepo?                    | nothing, if packages export `.ts` source; `references.json` if they export built output |
| Node runs `.ts` directly?    | `strip-types.json`                                                                      |

## What each file sets, and why

### base.json

The base assumes code that a bundler (Vite, tsdown, esbuild, Bun) turns into JavaScript, so tsc only checks. `tsc.json` flips that.

- `target: es2025`. What Node 24, Bun and evergreen browsers run. Bundlers downlevel from here; tsc's own output stays as written.
- `moduleDetection: force`. Every file is a module, so two script files never share a global scope.
- `module: preserve`. Keeps import/require as written and implies bundler resolution, which reads package.json `exports` and `imports`.
- `noEmit: true`. The bundler writes the JavaScript.
- `rewriteRelativeImportExtensions: true`. Write `./thing.ts` in relative imports. Node, Bun and every bundler accept it, and when tsc emits it rewrites to `.js`. This also switches on `allowImportingTsExtensions`.
- `resolveJsonModule: true`. Implied by `preserve`, kept explicit because `tsc.json` switches to `nodenext`.
- `verbatimModuleSyntax` and `isolatedModules`. Type imports must say `import type`, so each file can be transpiled on its own without the checker.
- `types: []`. Nothing is global until a runtime file says so.
- `strict`, plus the checks it leaves out: `exactOptionalPropertyTypes` (`{ a?: string }` no longer accepts `{ a: undefined }`), `noUncheckedIndexedAccess` (`arr[i]` is `T | undefined`), `noPropertyAccessFromIndexSignature` (values behind an index signature are read with brackets, so dynamic lookups look different from declared properties), `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `allowUnreachableCode: false`, `allowUnusedLabels: false`.
- Unused locals and parameters are left to the linter. The oxlint preset's `typescript/no-unused-vars` honours the `_` prefix and can be fixed.
- `skipLibCheck: true`. Declaration files in node_modules are not re-checked.

### dom.json

`lib: ["es2025", "dom"]`. Since TypeScript 6 the `dom` lib contains `dom.iterable` and `dom.asynciterable`.

### node.json

`lib: ["es2025"]` and `types: ["node"]`. Needs `@types/node`. Add `tsc.json` when tsc emits, or `strip-types.json` when Node runs the `.ts` files directly.

### bun.json

`lib: ["esnext"]` and `types: ["bun"]`. Needs `@types/bun`. Bun runs `.ts` directly and understands every TypeScript construct, so nothing about emit or erasable syntax applies.

### react.json

`dom.json` plus `jsx: react-jsx`. The automatic runtime imports `react/jsx-runtime` itself, so `@types/react` needs no `types` entry.

### tsc.json

tsc emits the JavaScript. `module: nodenext` for Node's ESM/CJS rules, `noEmit: false`, `rootDir` and `outDir` set to `src` and `dist` beside the extending tsconfig through `${configDir}`, and `sourceMap`. Override `rootDir`/`outDir` if the layout differs.

### library.json

A package other people import. `declaration` and `declarationMap` emit `.d.ts` with maps back to source. `isolatedDeclarations` makes every export carry an explicit type, so tsdown, oxc or Bun can produce the `.d.ts` without the TypeScript compiler API, which tsc 7 no longer ships. Under `base.json`'s `noEmit` this still checks; combine with `tsc.json` to have tsc write the files.

### references.json

A package in a monorepo that others consume through its built output, so `tsc --build` must know the graph: `composite`, `incremental`, `declarationMap`, and a `tsBuildInfoFile` under `node_modules/.tmp`. Not needed when packages export `.ts` source through package.json `exports`.

### strip-types.json

Node runs the `.ts` files itself (type stripping is on by default since Node 23.6). `erasableSyntaxOnly` allows only syntax Node can erase: no enums, namespaces, parameter properties or decorators.

## Requirements

TypeScript 6.0 or later. The presets lean on 6.0 defaults (`strict`, `types: []`, `noUncheckedSideEffectImports`, interop always on) and use nothing 7.0 removed (`baseUrl`, `downlevelIteration`, `moduleResolution: node10`). `es2025` as a `target` and `lib` value arrived in 6.0, so an editor whose language server bundles TypeScript 5.9 will reject these files; point it at a 6.x SDK.

## What stays with the consumer

`paths`, `include`, `exclude`, extra `types` such as `vite/client`, `jsxImportSource` for a non-React runtime, and `experimentalDecorators`/`emitDecoratorMetadata` where a DI container reads constructor metadata.
