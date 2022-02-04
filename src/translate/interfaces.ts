import { Node } from 'src/parser/interfaces';

export type ArithmeticType = 'plus' | 'minus' | 'times' | 'divide';
export type NumericValueNode = { type: 'value'; value: number };
export type FunctionCallNode = { type: 'function'; functionName: string };
export type EvaluateNode =
  | {
      type: ArithmeticType;
      children: EvaluateNode[];
    }
  | { type: 'node'; node: Node }
  | NumericValueNode
  | FunctionCallNode;

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
