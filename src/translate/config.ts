/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ExprHelper } from 'src/helpers/expr-helpers';
import { Definition, Expr } from './interfaces';

// 符号符号
function makeMetaSymbol(): Expr {
  const metaSymbol: Expr = {
    head: null as any,
    nodeType: 'terminal',
    expressionType: 'symbol',
    value: 'Symbol',
  };
  metaSymbol.head = metaSymbol;
  return metaSymbol;
}

export const SymbolSymbol: Expr = makeMetaSymbol();

export class NodeFactory {
  public static makeSymbol(name: string, nonStandard?: boolean): Expr {
    const sbl: Expr = {
      head: SymbolSymbol,
      nodeType: 'terminal',
      expressionType: 'symbol',
      value: name,
      nonStandard: false,
    };
    if (nonStandard) {
      sbl.nonStandard = true;
    }
    return sbl;
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

// 数值符号
export const NumberSymbol = NodeFactory.makeSymbol('Number', true);

// 赋值符号
export const AssignSymbol = NodeFactory.makeSymbol('Assign', true);

// 延迟赋值符号
export const AssignDelayedSymbol = NodeFactory.makeSymbol(
  'AssignDelayed',
  true,
);

// 清除赋值符号
export const ClearAssignSymbol = NodeFactory.makeSymbol('ClearAssign', true);

// 清除延迟赋值
export const ClearDelayedAssign = NodeFactory.makeSymbol(
  'ClearDelayedAssign',
  true,
);

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
export const StringSymbol = NodeFactory.makeSymbol('String', true);

// Sequence 符号
export const SequenceSymbol = NodeFactory.makeSymbol('Sequence');

// List 符号
export const ListSymbol = NodeFactory.makeSymbol('List');

// Head 符号
export const HeadSymbol = NodeFactory.makeSymbol('Head', true);

// Pattern 符号
export const PatternSymbol = NodeFactory.makeSymbol('Pattern', true);

// Nothing 符号
export const NothingSymbol = NodeFactory.makeSymbol('Nothing');

// Blank 符号
export const BlankSymbol = NodeFactory.makeSymbol('Blank', true);

// BlankSequence 符号
export const BlankSequenceSymbol = NodeFactory.makeSymbol(
  'BlankSequence',
  true,
);

// BlankSequenceNull 符号
export const BlankNullSequenceSymbol = NodeFactory.makeSymbol(
  'BlankNullSequence',
  true,
);

// If 符号
export const IfSymbol = NodeFactory.makeSymbol('If', true);

// Take 符号
export const TakeSymbol = NodeFactory.makeSymbol('Take', true);

// Integer 符号
export const IntegerSymbol = NodeFactory.makeSymbol('Integer', true);

// Real 符号
export const RealSymbol = NodeFactory.makeSymbol('Real', true);

// RawEqualQ 符号
export const RawEqualQSymbol = NodeFactory.makeSymbol('RawEqualQ', true);

// 全体符号集
export const allSymbols: Expr[] = [
  SymbolSymbol,
  NumberSymbol,
  AssignSymbol,
  AssignDelayedSymbol,
  ClearAssignSymbol,
  ClearDelayedAssign,
  NegativeSymbol,
  EqualQSymbol,
  GreaterThanSymbol,
  LessThanSymbol,
  GreaterThanOrEqualSymbol,
  LessThanOrEqualSymbol,
  PlusSymbol,
  MinusSymbol,
  TimesSymbol,
  DivideSymbol,
  PowerSymbol,
  StringSymbol,
  SequenceSymbol,
  ListSymbol,
  HeadSymbol,
  PatternSymbol,
  NothingSymbol,
  BlankSymbol,
  BlankSequenceSymbol,
  BlankNullSequenceSymbol,
  IfSymbol,
  TakeSymbol,
  IntegerSymbol,
  RealSymbol,
  RawEqualQSymbol,
];

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
    head: BlankNullSequenceSymbol,
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
  // If[cond, trueClause, falseClause], 走特殊求值流程
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: IfSymbol,
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
    final: true,
  },

  // Head[x:_] := x 的 头部, 走特殊求值流程
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
    final: true,
  },

  // Take[expr_, number_Integer] 访问第几个元素
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: TakeSymbol,
      children: [Blank(), TypedBlank(IntegerSymbol)],
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
      children: [NumberSymbol],
    },
    action: (expr, context) => {
      if (expr.nodeType === 'terminal' && expr.expressionType === 'number') {
        const value = expr.value;
        if (Math.floor(value) === value) {
          // 整数
          context.pushNode({
            nodeType: 'terminal',
            expressionType: 'number',
            head: IntegerSymbol,
            value: value,
          });
        } else {
          // 浮点数
          context.pushNode({
            nodeType: 'terminal',
            expressionType: 'number',
            head: RealSymbol,
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
      head: RawEqualQSymbol,
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
      head: EqualQSymbol,
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

  // 立即赋值 Assign[lhs, rhs], 走特殊求值流程，避免再对 lhs 求值
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: AssignSymbol,
      children: [Blank(), Blank()],
    },
    action: (node, context) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
        context.assign({
          pattern: node.children[0],
          value: node.children[1],
        });
      } else {
        context.pushNode(node);
      }
    },
    final: true,
  },

  // 延迟赋值 AssignDelayed[lhs, rhs], 走特殊求值流程，
  // 这是因为在 AssignDelayed 下面，lhs 和 rhs 都不宜被求值，毕竟 AssignDelayed 的含义是「延迟赋值」。
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: AssignDelayedSymbol,
      children: [Blank(), Blank()],
    },
    action: (node, context) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
        context.assignDelayed({
          pattern: node.children[0],
          value: node.children[1],
        });
      } else {
        context.pushNode(node);
      }
    },
    final: true,
  },

  // 清除赋值 ClearAssign[x]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: ClearAssignSymbol,
      children: [Blank()],
    },
    action: (node, context) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 1) {
        context.clearAssign(node.children[0]);
      } else {
        context.pushNode(node);
      }
    },
    final: true,
  },

  // 清除延迟赋值 ClearDelayedAssign[x]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: ClearDelayedAssign,
      children: [Blank()],
    },
    action: (node, context) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 1) {
        context.clearDelayedAssign(node.children[0]);
      } else {
        context.pushNode(node);
      }
    },
    final: true,
  },
];
