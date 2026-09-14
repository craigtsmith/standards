import type { ESTree, Visitor } from "@oxlint/plugins"

// `ESTree.Function` covers declarations, expressions, `declare function` and
// bodiless class methods.
export type SignatureNode =
  | ESTree.ArrowFunctionExpression
  | ESTree.Function
  | ESTree.TSCallSignatureDeclaration
  | ESTree.TSConstructSignatureDeclaration
  | ESTree.TSConstructorType
  | ESTree.TSFunctionType
  | ESTree.TSMethodSignature

/**
 * A visitor that calls `check` on every node with parameters and a return type, from function
 * literals to call, construct and method signatures.
 */
export function signatureVisitor(check: (node: SignatureNode) => void): Visitor {
  return {
    ArrowFunctionExpression: check,
    FunctionDeclaration: check,
    FunctionExpression: check,
    TSCallSignatureDeclaration: check,
    TSConstructorType: check,
    TSConstructSignatureDeclaration: check,
    TSDeclareFunction: check,
    TSEmptyBodyFunctionExpression: check,
    TSFunctionType: check,
    TSMethodSignature: check,
  }
}
