import { Node } from 'src/parser/interfaces';

export type ArithmeticType = 'plus' | 'minus' | 'times' | 'divde';
export type EvaluateNode =
  | {
      type: ArithmeticType;
      children: EvaluateNode[];
    }
  | { type: 'value'; value: Node };
