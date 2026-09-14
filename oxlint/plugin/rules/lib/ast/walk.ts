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
  for (const child of childNodes(node, visitorKeys)) visit(child)
}

// Children come in the order the node holds its slots, not the order of the keys.
// `flatMap` spreads a list slot and keeps a single slot as it is.
function childNodes(node: ESTree.Node, visitorKeys: VisitorKeys): readonly ESTree.Node[] {
  const keys = visitorKeys[node.type] ?? []
  const slots: readonly (readonly [string, unknown])[] = Object.entries(node)

  return slots
    .filter(([key]) => keys.includes(key))
    .flatMap(([, slot]) => slot)
    .filter(isNode)
}

// A child slot holds a node, a list of nodes, or nothing, so a `type` property
// is enough to identify a node.
function isNode(value: unknown): value is ESTree.Node {
  return value instanceof Object && "type" in value
}
