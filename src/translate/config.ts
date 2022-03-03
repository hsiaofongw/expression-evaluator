/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ExprHelper } from './evaluate';
import { Definition, Expr, PatternAction } from './interfaces';

// function ListNode(): FunctionNode {
//   return { type: 'function', nodeType: 'nonTerminal', head: { type: 'identifier', nodeType: 'terminal', value: 'List' }, children: [] };
// }

// 符号符号
export const SymbolSymbol: Expr = {
  head: null as any,
  nodeType: 'terminal',
  expressionType: 'symbol',
  value: 'Symbol',
};

// 符号符号的 head 也是符号
SymbolSymbol.head = SymbolSymbol;

export class NodeFactory {
  public static makeSymbol(name: string): Expr {
    return {
      head: SymbolSymbol,
      nodeType: 'terminal',
      expressionType: 'symbol',
      value: name,
    };
  }
}

export const True: Expr = {
  head: SymbolSymbol,
  nodeType: 'terminal',
  expressionType: 'boolean',
  value: true,
};

export const False: Expr = {
  head: SymbolSymbol,
  nodeType: 'terminal',
  expressionType: 'boolean',
  value: false,
};

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

// 字符串符号
export const StringSymbol = NodeFactory.makeSymbol('String');

// Sequence 符号
export const SequenceSymbol = NodeFactory.makeSymbol('Sequence');

// List 符号
export const ListSymbol = NodeFactory.makeSymbol('List');

// Head 符号
export const HeadSymbol = NodeFactory.makeSymbol('Head');

// Pattern 符号
export const PatternSymbol = NodeFactory.makeSymbol('Pattern');

// DirectFullEqualQ 符号
export const DirectFullEqualQSymbol =
  NodeFactory.makeSymbol('DirectFullEqualQ');

// Blank 符号
export const BlankSymbol = NodeFactory.makeSymbol('Blank');

// BlankSequence 符号
export const BlankSequenceSymbol = NodeFactory.makeSymbol('BlankSequence');

// BlankSequenceNull 符号
export const BlankSequenceNullSymbol =
  NodeFactory.makeSymbol('BlankSequenceNull');

// 返回一个 Blank Pattern
export function Blank(): Expr {
  return {
    nodeType: 'nonTerminal',
    head: BlankSymbol,
    children: [],
  };
}

// 返回一个 Typed Blank Pattern
export function TypedBlank(h: Expr): Expr {
  return {
    nodeType: 'nonTerminal',
    head: BlankSymbol,
    children: [h],
  };
}

// 返回一个 BlankSequence Pattern
export function BlankSequence(): Expr {
  return {
    nodeType: 'nonTerminal',
    head: BlankSequenceSymbol,
    children: [],
  };
}

// 返回一个 BlankSequenceNull Pattern
export function BlankSequenceNull(): Expr {
  return {
    nodeType: 'nonTerminal',
    head: BlankSequenceNullSymbol,
    children: [],
  };
}

// 返回一个命名 Pattern
export function NamedPattern(identifier: string, pattern: Expr): Expr {
  return {
    nodeType: 'nonTerminal',
    head: PatternSymbol,
    children: [NodeFactory.makeSymbol(identifier), pattern],
  };
}

// 返回一个 Sequence
export function Sequence(children: Expr[]): Expr {
  return {
    nodeType: 'nonTerminal',
    head: SequenceSymbol,
    children,
  };
}

// builtInDefinition 是按非标准程序求值的
export const builtInDefinitions: Definition[] = [
  // If[cond, trueClause, falseClause]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: NodeFactory.makeSymbol('If'),
      children: [Blank(), Blank(), Blank()],
    },
    action: (node, context) => {
      if (
        node.head.nodeType === 'terminal' &&
        node.head.expressionType === 'symbol' &&
        node.head.value === 'If' &&
        node.nodeType === 'nonTerminal' &&
        node.children.length === 3
      ) {
        const condition = node.children[0];
        const trueClause = node.children[1];
        const falseClause = node.children[2];

        context.evaluate(condition);
        const evaluatedCondition = context.popNode();
        if (ExprHelper.rawEqualQ([True], [evaluatedCondition])) {
          context.evaluate(trueClause);
        } else {
          context.evaluate(falseClause);
        }
      } else {
        context.pushNode(node);
      }
    },
  },

  // Head[x:_] := x 的 头部
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: HeadSymbol,
      children: [Blank()],
    },
    action: (node, context) => {
      if (
        node.nodeType === 'nonTerminal' &&
        node.head.nodeType === 'terminal' &&
        node.head.expressionType === 'symbol' &&
        node.head.value === 'Head' &&
        node.children.length === 1
      ) {
        context.evaluate(node.children[0].head);
      } else {
        context.pushNode(node);
      }
    },
  },

  // Take[expr, number] 访问第几个元素
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: NodeFactory.makeSymbol('Take'),
      children: [Blank(), TypedBlank(NodeFactory.makeSymbol('Integer'))],
    },
    action: (node, context) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
        const expr = node.children[0];
        const number = node.children[1];
        if (
          expr.nodeType === 'nonTerminal' &&
          number.nodeType === 'terminal' &&
          number.expressionType === 'number' &&
          number.value >= 0
        ) {
          const index = Math.floor(number.value);
          if (expr.children.length > index) {
            context.evaluate(expr.children[index]);
            return;
          }
        }
      }

      context.pushNode(node);
    },
  },

  // Number[x], 待定类型数字，一定要演化成 Real[x] 或者 Integer[x]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: BlankSymbol,
      children: [NodeFactory.makeSymbol('Number')],
    },
    action: (expr, context) => {
      if (expr.nodeType === 'terminal' && expr.expressionType === 'number') {
        const value = expr.value;
        if (Math.floor(value) === value) {
          // 整数
          context.pushNode({
            nodeType: 'terminal',
            expressionType: 'number',
            head: NodeFactory.makeSymbol('Integer'),
            value: value,
          });
        } else {
          // 浮点数
          context.pushNode({
            nodeType: 'terminal',
            expressionType: 'number',
            head: NodeFactory.makeSymbol('Real'),
            value: value,
          });
        }
      } else {
        context.pushNode(expr);
      }
    },
  },

  // 直接相等判断
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: NodeFactory.makeSymbol('RawEqualQ'),
      children: [Blank(), Blank()],
    },
    action: (node, context) => {
      if (
        node.head.nodeType === 'terminal' &&
        node.head.expressionType === 'symbol' &&
        node.head.value === 'RawEqualQ' &&
        node.nodeType === 'nonTerminal' &&
        node.children.length === 2
      ) {
        if (ExprHelper.rawEqualQ([node.children[0]], [node.children[1]])) {
          context.pushNode(True);
        } else {
          context.pushNode(False);
        }
      } else {
        context.pushNode(node);
      }
    },
  },

  // 定义相等判断
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: NodeFactory.makeSymbol('EqualQ'),
      children: [Blank(), Blank()],
    },
    action: (node, context) => {
      if (
        node.head.nodeType === 'terminal' &&
        node.head.expressionType === 'symbol' &&
        node.head.value === 'EqualQ' &&
        node.nodeType === 'nonTerminal' &&
        node.children.length === 2
      ) {
        context.evaluate(node.children[0]);
        context.evaluate(node.children[1]);
        const rhs = context.popNode();
        const lhs = context.popNode();
        context.evaluate({
          nodeType: 'nonTerminal',
          head: NodeFactory.makeSymbol('RawEqualQ'),
          children: [lhs, rhs],
        });
      } else {
        context.pushNode(node);
      }
    },
  },

  // 立即赋值 Assign[x, y]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: NodeFactory.makeSymbol('Assign'),
      children: [Blank(), Blank()],
    },
    action: (node, context) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
        context.evaluate(node.children[1]);
        const rightValue = context.popNode();
        context.assign([
          {
            pattern: node.children[0],
            value: rightValue,
          },
        ]);
      } else {
        context.pushNode(node);
      }
    },
  },

  // 延迟赋值 AssignDelayed[x, y]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: NodeFactory.makeSymbol('AssignDelayed'),
      children: [Blank(), Blank()],
    },
    action: (node, context) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
        context.assignDelayed([
          {
            pattern: node.children[0],
            value: node.children[1],
          },
        ]);
      } else {
        context.pushNode(node);
      }
    },
  },
];
