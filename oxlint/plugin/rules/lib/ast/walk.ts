import type { ESTree } from "@oxlint/plugins"

export type VisitorKeys = Readonly<Record<string, readonly string[]>>

/**
 * Calls a visitor on each direct child node of a node, using the visitor keys for its type.
 *
 * @param node - The node whose children are visited.
 * @param visitorKeys - The child property names per node type.
 * @param visit - The callback invoked with each child node.
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
