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

export const patternActions: PatternAction[] = [
  // Blank[]
  {
    forPattern: (pattern: Expr) => ExprHelper.l1Compare(pattern, Blank()),
    action: (seq: Expr[]) => {
      if (seq.length === 0) {
        return { pass: false };
      } else {
        const expr = seq.shift() as Expr;
        return { pass: true, exprs: [expr] };
      }
    },
  },

  // Blank[symbol]
  {
    forPattern: (pattern: Expr) => {
      return (
        ExprHelper.l0Compare(pattern.head, BlankSymbol) &&
        pattern.nodeType === 'nonTerminal' &&
        pattern.children[0] !== undefined &&
        ExprHelper.isSymbol(pattern.children[0])
      );
    },
    action: (seq, pattern) => {
      if (pattern.nodeType === 'nonTerminal' && seq.length > 0) {
        const expr = seq[0];
        const exprHead = expr.head;
        const expectedHead = pattern.children[0];
        if (ExprHelper.l0Compare(exprHead, expectedHead)) {
          seq.shift();
          return { pass: true, exprs: [expr] };
        }
      }

      return { pass: false };
    },
  },

  // Pattern[Blank[symbol], pattern]
  {
    forPattern: (pattern: Expr) => {
      return (
        ExprHelper.l0Compare(pattern.head, BlankSymbol) &&
        pattern.nodeType === 'nonTerminal' &&
        pattern.children.length === 2 &&
        ExprHelper.isSymbol(pattern.children[0])
      );
    },
    action: (seq, pattern, context) => {
      if (pattern.nodeType === 'nonTerminal' && pattern.children.length === 2) {
        const nameExpr = pattern.children[0];
        if (
          nameExpr &&
          nameExpr.nodeType === 'terminal' &&
          nameExpr.expressionType === 'symbol'
        ) {
          const name = nameExpr.value;
          const subAction = patternActions.find((_action) =>
            _action.forPattern(pattern.children[1]),
          );
          if (subAction) {
            const matchResult = subAction.action(
              seq,
              pattern.children[1],
              context,
            );
            if (!matchResult.pass) {
              return { pass: false };
            }

            return { ...matchResult, name: name };
          }
        }
      }

      return { pass: false };
    },
  },

  // BlankSequence[]
  {
    forPattern: (pattern: Expr) =>
      ExprHelper.l1Compare(pattern, BlankSequence()),
    action: (seq: Expr[]) => {
      if (seq.length === 0) {
        return { pass: false };
      } else {
        const result: Expr[] = [];

        while (seq.length > 0) {
          const expr = seq.shift() as Expr;
          result.push(expr);
        }
        return { pass: true, exprs: result };
      }
    },
  },

  // BlankSequenceNull[]
  {
    forPattern: (pattern: Expr) =>
      ExprHelper.l1Compare(pattern, BlankSequenceNull()),
    action: (seq: Expr[]) => {
      if (seq.length === 0) {
        return { pass: true, exprs: [] };
      } else {
        const result: Expr[] = [];

        while (seq.length > 0) {
          const expr = seq.shift() as Expr;
          result.push(expr);
        }
        return { pass: true, exprs: result };
      }
    },
  },
];

export const builtInDefinitions: Definition[] = [
  // Head[x:_] := x 的 头部
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: HeadSymbol,
      children: [Blank()],
    },
    action: (node, context) => {
      if (node.nodeType === 'nonTerminal') {
        if (node.children[0].nodeType === 'nonTerminal') {
          const x = node.children[0].children[0];
          context.pushNode(x);
        }
      }
    },
  },

  // 立即赋值语句
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: DirectFullEqualQSymbol,
      children: [NamedPattern('x', Blank()), NamedPattern('y', Blank())],
    },
    action: (expr, ctx) => {},
  },
];
