# fallow preset

`preset.jsonc` is a fallow config to extend. It sets rule severities, boundary coverage and health thresholds. Entry points, zones and ignores stay with the project.

## Extending it

In `.fallowrc.json`:

```json
{
  "$schema": "./node_modules/fallow/schema.json",
  "extends": ["npm:@craigts.dev/standards/fallow/preset.jsonc"]
}
```

fallow reads an `npm:` subpath as a file path inside the package directory. It ignores package.json `exports`, so the specifier names the file. `npm:@craigts.dev/standards/fallow` fails because it is a directory.

`fallow` is an optional peer dependency. Install it beside this package.

fallow does not count an `npm:` extends as a use of the package. A project that imports nothing from `@craigts.dev/standards` gets an unused-devDependency finding for it. Add it to that project's `ignoreDependencies`.

## What it sets

### Rules

These rules are `error`. fallow's default is `warn` for all of them except `unused-dependencies`, which is already `error`, and `require-suppression-reason`, which is `off`.

- `unused-dependencies`, `unused-dev-dependencies`, `unused-optional-dependencies`
- `unrendered-components`, `unused-component-props`
- `css-token-drift`, `css-dead-surface`, `css-duplicate-block`, `css-broken-reference`, `css-selector-complexity`
- `require-suppression-reason`: a `fallow-ignore` comment must say why.
- `stale-suppressions`: a `fallow-ignore` comment that suppresses nothing is reported.

### Boundaries

`boundaries.coverage.requireAllFiles` is `true`. Every source file must belong to a zone, so the project declares `boundaries.zones`. Until it does, each file is reported with "no matching boundary zone". Use `boundaries.coverage.allowUnmatched` for files that belong to no zone, such as root config files.

### Health

| Threshold       | Preset | fallow default |
| --------------- | ------ | -------------- |
| `maxCyclomatic` | 10     | 20             |
| `maxCognitive`  | 4      | 15             |
| `maxUnitSize`   | 40     | 60             |

## Overriding

The project's config merges over the preset. Objects merge key by key, so one threshold can change and the others stay:

```json
{
  "extends": ["npm:@craigts.dev/standards/fallow/preset.jsonc"],
  "health": { "maxCognitive": 8 },
  "rules": { "css-selector-complexity": "warn" }
}
```

Arrays replace the preset's value. The preset sets no arrays.

## This repo

`.fallowrc.jsonc` at the repo root extends `./fallow/preset.jsonc`, so the preset is checked here with the same thresholds. It adds this repo's entry points, zones, `ignoreDependencies` for the eslint plugins the oxlint preset loads through `import.meta.resolve`, and `audit.healthBaseline`, which points at `fallow-health-baseline.json`. That baseline should hold no findings.
