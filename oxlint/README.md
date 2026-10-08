# oxlint preset

`@craigts.dev/standards/oxlint` is an oxlint preset for TypeScript projects. It exports `defineConfig`, which adds the configuration of your project to the preset. The preset also loads `standards`, a JS plugin with custom rules.

Install the package and its peer dependencies as the [root README](../README.md) shows. Then create `oxlint.config.ts` in the project root:

```ts
import { defineConfig } from "@craigts.dev/standards/oxlint"

export default defineConfig()
```

## Change the preset in your project

Give your changes to `defineConfig`. A rule in your `rules` replaces the setting of the preset for that rule. If you give options, they replace all the options of the preset for that rule.

The preset sets no React version. If your project uses React, set the version in `settings`.

```ts
import { defineConfig } from "@craigts.dev/standards/oxlint"

export default defineConfig({
  rules: { "eslint/max-params": ["error", 4] },
  settings: { react: { version: "19" } },
})
```

To disable a rule, set it to `"off"`.

Five `typescript` rules share their name with an eslint core rule: `class-methods-use-this`, `no-array-constructor`, `no-unused-expressions`, `no-unused-vars` and `no-useless-constructor`. oxlint keeps one setting for each pair. A setting under the `eslint/` name or the `typescript/` name replaces the setting of the preset.

### How your configuration merges with the preset

oxlint's `extends` replaces `env` and `ignorePatterns` with the values of your project. For this reason, `defineConfig` merges these two keys itself.

| Key              | Result                                                                              |
| ---------------- | ----------------------------------------------------------------------------------- |
| `env`            | `defineConfig` merges your keys over the keys of the preset.                        |
| `ignorePatterns` | `defineConfig` adds your patterns to the list of the preset.                        |
| `extends`        | `defineConfig` puts the preset first, then your entries.                            |
| `rules`          | oxlint's `extends` merges them. Your entry replaces the preset entry for that rule. |
| `overrides`      | oxlint's `extends` merges them with the overrides of the preset.                    |
| `plugins`        | oxlint's `extends` merges them with the plugins of the preset.                      |
| Other keys       | `defineConfig` passes them to oxlint unchanged.                                     |

## What the preset enables

### Categories

| Category      | Severity |
| ------------- | -------- |
| `correctness` | error    |
| `perf`        | warn     |
| `suspicious`  | warn     |

A category enables every built-in rule in that category for the enabled plugins. The rule files of the preset do not list these rules. Thus a rule can be enabled although no rule file names it.

### Built-in plugins

The preset enables these oxlint plugins: `import`, `jsdoc`, `jsx-a11y`, `node`, `oxc`, `promise`, `react`, `typescript`, `unicorn` and `vitest`. The eslint core rules are always available.

### JS plugins

| Prefix          | Package                                | Contents                                                       |
| --------------- | -------------------------------------- | -------------------------------------------------------------- |
| `standards`     | `@craigts.dev/standards/oxlint/plugin` | The custom rules of this package.                              |
| `jsdoc-js`      | `eslint-plugin-jsdoc`                  | Only the doc block rules that the native `jsdoc` port lacks.   |
| `perfectionist` | `eslint-plugin-perfectionist`          | Sort order of imports, class members, modules, props and keys. |
| `sonarjs`       | `eslint-plugin-sonarjs`                | Control flow, hardcoded credentials, OS commands, test checks. |

oxlint reserves the `jsdoc` prefix for its native port in Rust. For this reason, the preset loads `eslint-plugin-jsdoc` under the alias `jsdoc-js`. No rule appears under both prefixes.

The three eslint plugins are dependencies of this package. The preset resolves them from its own location, so your project does not install them.

A category does not enable JS plugin rules. A JS plugin rule is enabled only when a rule file of the preset names it.

### Type-aware linting

The preset sets `options.typeAware` to `true`. oxlint runs the rules that need type information through `oxlint-tsgolint`, for example `typescript/no-unsafe-assignment`. Your project must install `oxlint-tsgolint`.

### Environment

All files get the `browser` and `es2025` globals. These files also get the `node` globals:

- config files: `**/*.config.{ts,mts,js,mjs}`
- scripts: `**/scripts/**`
- test files

### Ignored paths

The preset ignores `**/dist`, `**/out`, `**/.astro`, `**/node_modules` and `**/.claude`.

### Test files and declaration files

Test files are the files that match `**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}` or `**/e2e/**`. In test files, the preset disables these rules:

- the size limits: `eslint/max-depth`, `eslint/max-lines`, `eslint/max-lines-per-function`, `eslint/max-nested-callbacks`, `eslint/max-params`, `eslint/max-statements`
- these `typescript` rules: `class-methods-use-this`, `no-explicit-any`, `no-extraneous-class`, `no-non-null-assertion`, `no-unsafe-assignment`, `no-unsafe-return`, `no-unsafe-type-assertion`

In `**/*.d.ts` files, the preset disables `sonarjs/no-redundant-assignments`.

### Size limits

| Rule                            | Limit | Blank and comment lines |
| ------------------------------- | ----- | ----------------------- |
| `eslint/max-depth`              | 2     |                         |
| `eslint/max-lines`              | 150   | not counted             |
| `eslint/max-lines-per-function` | 40    | not counted             |
| `eslint/max-nested-callbacks`   | 3     |                         |
| `eslint/max-params`             | 3     |                         |
| `eslint/max-statements`         | 10    |                         |

### Rule options

| Rule                                     | Option                                                                        | Effect                                                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `typescript/no-unused-vars`              | `argsIgnorePattern` and `varsIgnorePattern` are `^_`                          | A name that starts with `_` can stay unused.                                                         |
| `eslint/prefer-const`                    | `destructuring: "all"`, `ignoreReadBeforeAssign: true`                        | If code reassigns one binding of a destructuring, all bindings of that destructuring can stay `let`. |
| `eslint/no-warning-comments`             | `terms: ["jscpd:ignore-start", "jscpd:ignore-end"]`                           | The rule reports jscpd ignore markers anywhere in a comment.                                         |
| `typescript/consistent-type-definitions` | `"interface"`                                                                 | The rule reports an object type that is written as a type alias.                                     |
| `typescript/no-empty-object-type`        | `allowInterfaces: "with-single-extends"`                                      | An empty interface that extends one type is allowed.                                                 |
| `typescript/class-methods-use-this`      | `ignoreClassesWithImplements: "public-fields"`, `ignoreOverrideMethods: true` | The rule ignores override methods and the public members of a class that implements an interface.    |
| `standards/no-runtime-typeof`            | `allowInTypeGuards: true`                                                     | A `typeof` check inside a type predicate is allowed.                                                 |
| `unicorn/catch-error-name`               | `name: "error"`                                                               | The catch parameter is `error`.                                                                      |
| `unicorn/filename-case`                  | `case: "kebabCase"`, severity warn                                            | File names are kebab-case.                                                                           |
| `promise/always-return`                  | `ignoreLastCallback: true`, severity warn                                     | The last `then` callback in a chain can return nothing.                                              |

### Sort order

Inside each group, the `perfectionist` rules use natural sort order. `sort-modules` is the exception.

| Rule                           | Order                                                                                                                                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `perfectionist/sort-imports`   | React, then type imports, then built-in and external modules. After a blank line: internal, parent, sibling and index imports. After a blank line: side-effect imports.                                                                                                                 |
| `perfectionist/sort-classes`   | Index signatures and abstract members. Then fields: private, protected, public. Static before instance, readonly first. Then static blocks and the constructor. Then accessors, each getter beside its setter. Then static methods, private first. Then instance methods, public first. |
| `perfectionist/sort-modules`   | Exported types, then local types. Then exported classes and functions, then local classes and functions. Inside a group, the rule keeps your order.                                                                                                                                     |
| `perfectionist/sort-jsx-props` | `key`, `ref`, `id`, `className` and `style`, `aria-` and `data-` props, shorthand props, string values, other expressions, objects, JSX, callbacks. Multiline props come last.                                                                                                          |
| `perfectionist/sort-objects`   | Properties first, then methods after a blank line.                                                                                                                                                                                                                                      |

`sort-enums`, `sort-exports`, `sort-interfaces`, `sort-maps`, `sort-object-types` and `sort-sets` sort by name only.

## Find where a rule is set

The prefix in a diagnostic names the rule file. `sonarjs(no-nested-conditional)` is in `config/rules/sonarjs.ts`. In your project, the same file is `node_modules/@craigts.dev/standards/dist/oxlint/config/rules/sonarjs.js`.

The five shared `typescript` rules in [Change the preset in your project](#change-the-preset-in-your-project) are an exception. Their diagnostics show the `eslint` prefix, but the preset sets them in `typescript.ts`.

If no rule file names a rule, a category enables it. To see the resolved set of built-in rules, run this command:

```sh
npx oxlint --print-config
```

The output shows eslint core rules without a prefix and `jsx-a11y` rules as `jsx_a11y`. It does not show JS plugin rules. For those rules, read `jsdoc-js.ts`, `perfectionist.ts`, `sonarjs.ts` and `standards.ts`.

## Rules the preset disables

- `eslint/no-await-in-loop`
- `eslint/no-underscore-dangle`
- `import/no-unassigned-import`
- `jsdoc/check-tag-names`
- `jsdoc/require-property`
- `jsdoc/require-property-type`
- `jsdoc/require-yields`
- `oxc/missing-throw`
- `react/react-in-jsx-scope`
- `typescript/consistent-return`
- `typescript/unbound-method`
- `unicorn/no-unnecessary-await`
- `vitest/require-mock-type-parameters`
- `jsdoc-js/check-indentation`
- `jsdoc-js/sort-tags`

## Comments and doc blocks

### `standards/max-comment-lines`

This rule sets a line limit for each kind of comment. [`docs/rules/max-comment-lines.md`](../docs/rules/max-comment-lines.md) gives the full definition.

| Option      | Limit | Applies to                                                                                          |
| ----------- | ----- | --------------------------------------------------------------------------------------------------- |
| `max`       | 3     | An ordinary comment.                                                                                |
| `maxDoc`    | 15    | A documentation block: a well-formed `/** */` block on an exported or ambient declaration.          |
| `maxHeader` | 20    | A file header: a well-formed `/** */` block on line 1, or line 2 after a shebang, before any token. |

- Adjacent `//` lines count as one comment. A single blank line, or a line with only `//`, continues the comment. Two blank lines end it.
- A `/* */` block counts its own lines.
- On an unexported declaration, a `/** */` block is documentation only if it has a block tag. `@internal` is sufficient. Without a tag, the block is an ordinary comment.
- The rule always treats a block on line 1 as the file header.

### Doc block rules

No rule requires a tag or a doc block. The preset enables no `require-jsdoc`, `require-param` or `require-returns` rule. `/** Why this exists. */` is a complete doc block on a function.

The enabled rules check what a block contains:

| Rule                                                                   | Reports                                                                                  |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `jsdoc-js/require-description`                                         | A block that has only tags.                                                              |
| `jsdoc-js/check-param-names`                                           | A `@param` for a parameter that does not exist, and a duplicate `@param`.                |
| `jsdoc/require-param-description`, `jsdoc/require-returns-description` | A `@param` or `@returns` tag without a description.                                      |
| `jsdoc-js/check-tag-names`                                             | An unknown tag. TSDoc tags such as `@remarks` are accepted.                              |
| `jsdoc/empty-tags`                                                     | Content on a tag that takes no content.                                                  |
| `jsdoc-js/no-types`                                                    | A type in a tag.                                                                         |
| `jsdoc-js/informative-docs` (warn)                                     | A description that only repeats the name.                                                |
| `jsdoc-js/tag-lines`                                                   | A missing blank line between the description and the tags, or a blank line between tags. |

`jsdoc-js/check-param-names` sets `disableMissingParamChecks` and `checkDestructured: false`. Thus a `@param` for one parameter does not require a `@param` for the other parameters or for destructured properties.

## Custom rules

[`docs/rules/README.md`](../docs/rules/README.md) lists the rules of the `standards` plugin. The preset enables all of them.
