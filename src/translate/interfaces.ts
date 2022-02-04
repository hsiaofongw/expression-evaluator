export type BuiltInArithmeticFunctionName =
  | 'Plus'
  | 'Minus'
  | 'Times'
  | 'Divide';
export type FunctionNode = {
  type: 'function';
  functionName: string;
  children: ExpressionNode[];
};
export type IdentifierNode = { type: 'identifier'; identifier: string };
export type ValueNode = { type: 'value'; value: number };
export type ExpressionNode = FunctionNode | IdentifierNode | ValueNode;
export type Evaluator = (node: ExpressionNode) => void;
export type EvaluatorMap = Record<string, Evaluator>;
export type ExpressionNodeReduceFuntion = (
  a: ExpressionNode,
  b: ExpressionNode,
) => ExpressionNode;
