import { Node } from 'src/parser/interfaces';

export type ArithmeticType = 'plus' | 'minus' | 'times' | 'divide';
export type NumericValueNode = { type: 'value'; value: number };
export type EvaluateNode =
  | {
      type: ArithmeticType;
      children: EvaluateNode[];
    }
  | { type: 'node'; node: Node }
  | NumericValueNode;
