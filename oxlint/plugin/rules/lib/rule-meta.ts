import type { Context, Options, RuleDocs } from "@oxlint/plugins"

const DOCS_BASE = "https://github.com/craigtsmith/standards/blob/main/docs/rules"

/**
 * A rule's `meta.docs`, with the URL of its page under `docs/rules`.
 */
export function ruleDocs(name: string, description: string): RuleDocs {
  return { description, url: `${DOCS_BASE}/${name}.md` }
}

/**
 * One key of a rule's options object. oxlint validates options against `meta.schema` and merges
 * `meta.defaultOptions` under them before the rule runs, so a key with a default is always set.
 */
export function ruleOption(context: Context, key: string): Options[number] | undefined {
  const [options] = context.options

  return options instanceof Object && !Array.isArray(options) ? options[key] : undefined
}
