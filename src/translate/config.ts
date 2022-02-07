/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ExpressionNode } from './interfaces';

// function ListNode(): FunctionNode {
//   return { type: 'function', nodeType: 'nonTerminal', head: { type: 'identifier', nodeType: 'terminal', value: 'List' }, children: [] };
// }

// 符号符号
export const SymbolSymbol: ExpressionNode = {
  head: null as any,
  nodeType: 'terminal',
  expressionType: 'symbol',
  value: 'Symbol',
};

// 符号符号的 head 也是符号
SymbolSymbol.head = SymbolSymbol;

export class NodeFactory {
  public static makeSymbol(name: string): ExpressionNode {
    return {
      head: SymbolSymbol,
      nodeType: 'terminal',
      expressionType: 'symbol',
      value: name,
    };
  }
}

// 数组符号
export const NumberSymbol = NodeFactory.makeSymbol('Number');

// 赋值符号
export const AssignSymbol = NodeFactory.makeSymbol('Assign');

// 取负符号
export const NegativeSymbol = NodeFactory.makeSymbol('Negative');

// 相等判断符号
export const EqualQSymbol = NodeFactory.makeSymbol('EqualQ');

// 严格大于判定符号
export const GreaterThanSymbol = NodeFactory.makeSymbol('GreaterThan');

// 严格小于判定符号
export const LessThanSymbol = NodeFactory.makeSymbol('LessThan');

// 严格不小于判定符号
export const GreaterThanOrEqualSymbol = NodeFactory.makeSymbol(
  'GreaterThanOrEqualSymbol',
);

// 严格不大于判定符号
export const LessThanOrEqualSymbol = NodeFactory.makeSymbol('LessThanOrEqual');

// 相加符号
export const PlusSymbol = NodeFactory.makeSymbol('Plus');

// 相减符号
export const MinusSymbol = NodeFactory.makeSymbol('Minus');

// 相乘符号
export const TimesSymbol = NodeFactory.makeSymbol('Times');

// 相除符号
export const DivideSymbol = NodeFactory.makeSymbol('Divide');

// 取余数符号
export const RemainderSymbol = NodeFactory.makeSymbol('Remainder');

// 幂次运算符号
export const PowerSymbol = NodeFactory.makeSymbol('Power');
