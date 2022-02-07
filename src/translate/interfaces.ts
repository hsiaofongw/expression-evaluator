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

export type ValueNode = {
  type: 'value';
  numberType: 'integer' | 'float';
  value: number;
};

export type PrintableNode = { type: 'printable'; value: string };

export type NullNode = { type: 'nothing' };

export type IdentifierNode = { type: 'identifier'; value: string };

export type BooleanNode = { type: 'boolean'; value: boolean };

export type StringNode = { type: 'string'; value: string };

export type ExpressionNode =
  | FunctionNode
  | ValueNode
  | BooleanNode
  | StringNode
  | IdentifierNode
  | PrintableNode
  | NullNode;

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

export type NamedEvaluator = {
  match: { type: 'functionName'; functionName: string };
  action: (node: FunctionNode, context: IEvaluateContext) => void;
};

export type RegexpMatchEvaluator = {
  match: { type: 'regexp'; regexp: RegExp };
  action: (node: FunctionNode, context: IEvaluateContext) => void;
};

export type ExpressionNodeEvaluator = NamedEvaluator | RegexpMatchEvaluator;
