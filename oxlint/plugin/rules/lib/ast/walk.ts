import type { ESTree } from "@oxlint/plugins"

export type VisitorKeys = Readonly<Record<string, readonly string[]>>

/**
 * Calls `visit` on each direct child of a node, using the visitor keys for its type.
 */
export function forEachChild(
  node: ESTree.Node,
  visitorKeys: VisitorKeys,
  visit: (child: ESTree.Node) => void
): void {
  const keys = visitorKeys[node.type] ?? []
  const slots: readonly (readonly [string, unknown])[] = Object.entries(node)

  for (const [key, slot] of slots) {
    if (!keys.includes(key)) continue

    const values: readonly unknown[] = Array.isArray(slot) ? slot : [slot]

    for (const child of values.filter(isNode)) visit(child)
  }
}

// A child slot holds a node, a list of nodes, or nothing, so a `type` property
// is enough to identify a node.
function isNode(value: unknown): value is ESTree.Node {
  return value instanceof Object && "type" in value
}
