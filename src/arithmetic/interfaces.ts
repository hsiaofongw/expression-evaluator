import { Node } from 'src/parser/interfaces';

export type ArithmeticNode = OperatorNode | OperandNode;
export type OperandNode = { type: 'operand'; node: Node };
export type OperatorNode = {
  type: 'operator';
  node: Node;
  children: ArithmeticNode[];
};
