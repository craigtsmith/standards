import { noForbiddenTermInSymbolNamesRule } from "./no-shape-in-symbol-names.ts"
import { ruleTester, tsxRuleTester } from "./rule-tester.ts"

const error = (name: string) => ({ data: { name }, messageId: "forbiddenSymbolName" })

ruleTester.run("no-shape-in-symbol-names", noForbiddenTermInSymbolNamesRule, {
  invalid: [
    { code: "const shape = 1", errors: [error("shape")] },
    { code: "const boxShape = 1", errors: [error("boxShape")] },
    { code: "const SHAPE_KIND = 1", errors: [error("SHAPE_KIND")] },
    { code: "interface Shape { width: number }", errors: [error("Shape")] },
    { code: "type ShapeKind = 'box'", errors: [error("ShapeKind")] },
    { code: "function reshape() {}", errors: [error("reshape")] },
    { code: "class Box { #shape = 1 }", errors: [error("shape")] },
    // A computed member is an expression of ours, not a borrowed name.
    { code: "const w = geometry[shape]", errors: [error("shape")] },
  ],
  valid: [
    "const outline = 1",
    "interface Contract { width: number }",
    // A member read from someone else's object is their name, not ours.
    "const w = geometry.shape",
    "const w = geometry.shape.width",
    "class Box { #size = 1 }",
  ],
})

tsxRuleTester.run("no-shape-in-symbol-names (jsx)", noForbiddenTermInSymbolNamesRule, {
  valid: ["const el = <Outline />", "const el = <div outline='x' />"],
  invalid: [
    { code: "const el = <Shape />", errors: [error("Shape")] },
    { code: "const el = <div shape='x' />", errors: [error("shape")] },
  ],
})
