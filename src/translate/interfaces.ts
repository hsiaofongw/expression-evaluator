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
export type ValueNode = { type: 'value'; value: number };
export type IdentifierNode = { type: 'identifier'; value: string };
export type BooleanNode = { type: 'boolean'; value: boolean };
export type ExpressionNode =
  | FunctionNode
  | ValueNode
  | BooleanNode
  | IdentifierNode;

export interface IEvaluateContext {
  _evaluate(node: ExpressionNode): void;
  _popNode(): ExpressionNode;
  _pushNode(node: ExpressionNode): void;
  _getValue(identifierNode: IdentifierNode): ExpressionNode;
  _setValue(identifier: string, node: ExpressionNode): void;
  _getHistory(idx: number): ExpressionNode;
  _getHistoryLength(): number;
  _getMostRecentHistory(): ExpressionNode;
}

export type ExpressionNodeEvaluator = {
  match:
    | { type: 'functionName'; functionName: string }
    | { type: 'regexp'; regexp: RegExp };
  action(node: FunctionNode, context: IEvaluateContext): void;
};
