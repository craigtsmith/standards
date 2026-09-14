# standards/max-comment-lines

Reports a comment longer than its limit. An ordinary comment may run to three lines, a documentation block to fifteen and a file header to twenty, so long prose has to move to documentation or out of the code.

Enabled in the preset: `"error"`, default options.

## Options

```json
{ "max": 3, "maxDoc": 15, "maxHeader": 20 }
```

- `max`: lines for an ordinary comment.
- `maxDoc`: lines for a documentation block.
- `maxHeader`: lines for a file header.

Each is a positive integer. The three limits are independent.

## What counts as what

- Adjacent `//` lines count as one run. A line holding only `//` or a single blank line continues the run and counts towards it. Two blank lines end it.
- A `/* */` block counts its own lines.
- A documentation block is a well-formed `/** */` block on an exported or ambient declaration. Members of an exported class, interface or object count as exported. Everything in a `.d.ts` file is ambient.
- A `/** */` block on an unexported declaration is documentation only if it carries a block tag such as `@returns` or `@internal`. An inline `{@link}` is not a block tag. Without a tag it is an ordinary comment.
- A `/** */` block is an ordinary comment when it documents nothing, has text on its opening or closing line, or has a body line without a leading `*`.
- A file header is a well-formed `/** */` block on line 1, or line 2 after a shebang, before any token. A block there is always judged as the header.
- A header must be followed by a blank line, unless it is valid documentation for the code directly below it.

## Examples

### Incorrect

```ts
// Load the config.
// Fall back to defaults when the file is missing.
// Merge environment overrides last.
// Freeze the result.
const config = loadConfig()

/**
 * Formats a price for display.
 * Uses the user's locale.
 * Rounds to two decimal places.
 */
function formatPrice(value: number) {}
```

```ts
/**
 * Command-line entry point.
 */
const args = process.argv.slice(2)
```

### Correct

```ts
// Load the config, falling back to defaults when the file is missing.
// Environment overrides are merged last.
const config = loadConfig()

/**
 * Formats a price for display.
 * Uses the user's locale.
 * Rounds to two decimal places.
 */
export function formatPrice(value: number) {}

/**
 * Formats a price for display.
 * Uses the user's locale.
 *
 * @internal
 */
function formatPriceInternal(value: number) {}
```

```ts
/**
 * Command-line entry point.
 */

const args = process.argv.slice(2)
```
