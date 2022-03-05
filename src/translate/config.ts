/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ExprHelper } from 'src/helpers/expr-helpers';
import { Definition, Expr } from './interfaces';

// 打印错误信息并退出
function logErrorAndExit(atWhere: string): void {
  console.error(`At ${atWhere}: pattern match incorrect.`);
  process.exit(1);
}

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

/** 元符号 */
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

export const allSymbolsMap = {
  // 元符号
  SymbolSymbol: SymbolSymbol,

  // 数值符号
  NumberSymbol: NodeFactory.makeSymbol('Number'),

  // 赋值符号
  AssignSymbol: NodeFactory.makeSymbol('Assign', true),

  // 延迟赋值符号
  AssignDelayedSymbol: NodeFactory.makeSymbol('AssignDelayed', true),

  // 清除赋值符号
  ClearAssignSymbol: NodeFactory.makeSymbol('ClearAssign', true),

  // 清除延迟赋值
  ClearDelayedAssignSymbol: NodeFactory.makeSymbol('ClearDelayedAssign', true),

  // 取负符号
  NegativeSymbol: NodeFactory.makeSymbol('Negative'),

  // 相等判断符号
  EqualQSymbol: NodeFactory.makeSymbol('EqualQ'),

  // 严格大于判定符号
  GreaterThanSymbol: NodeFactory.makeSymbol('GreaterThan'),

  // 严格小于判定符号
  LessThanSymbol: NodeFactory.makeSymbol('LessThan'),

  // 严格不小于判定符号
  GreaterThanOrEqualSymbol: NodeFactory.makeSymbol('GreaterThanOrEqual'),

  // 严格不大于判定符号
  LessThanOrEqualSymbol: NodeFactory.makeSymbol('LessThanOrEqual'),

  // 相加符号
  PlusSymbol: NodeFactory.makeSymbol('Plus'),

  // 相减符号
  MinusSymbol: NodeFactory.makeSymbol('Minus'),

  // 相乘符号
  TimesSymbol: NodeFactory.makeSymbol('Times'),

  // 相除符号
  DivideSymbol: NodeFactory.makeSymbol('Divide'),

  // 取余数符号
  RemainderSymbol: NodeFactory.makeSymbol('Remainder'),

  // 幂次运算符号
  PowerSymbol: NodeFactory.makeSymbol('Power'),

  // 一元自然指数幂符号
  ESymbol: NodeFactory.makeSymbol('E'),

  // 字符串符号
  StringSymbol: NodeFactory.makeSymbol('String', true),

  // Sequence 符号
  SequenceSymbol: NodeFactory.makeSymbol('Sequence', true),

  // List 符号
  ListSymbol: NodeFactory.makeSymbol('List', true),

  // Head 符号
  HeadSymbol: NodeFactory.makeSymbol('Head'),

  // Pattern 符号
  PatternSymbol: NodeFactory.makeSymbol('Pattern', true),

  // Nothing 符号
  NothingSymbol: NodeFactory.makeSymbol('Nothing', true),

  // Blank 符号
  BlankSymbol: NodeFactory.makeSymbol('Blank', true),

  // NumberExpressionType 符号
  NumberExpressionTypeSymbol: NodeFactory.makeSymbol(
    'NumberExpressionType',
    true,
  ),

  // 自然对数符号
  LnSymbol: NodeFactory.makeSymbol('Ln'),

  // 对数符号
  LogSymbol: NodeFactory.makeSymbol('Log'),

  // BlankSequence 符号
  BlankSequenceSymbol: NodeFactory.makeSymbol('BlankSequence', true),

  // BlankSequenceNull 符号
  BlankNullSequenceSymbol: NodeFactory.makeSymbol('BlankNullSequence', true),

  // If 符号
  IfSymbol: NodeFactory.makeSymbol('If', true),

  // Take 符号
  TakeSymbol: NodeFactory.makeSymbol('Take', true),

  // Integer 符号
  IntegerSymbol: NodeFactory.makeSymbol('Integer'),

  // Real 符号
  RealSymbol: NodeFactory.makeSymbol('Real'),

  // RawEqualQ 符号
  RawEqualQSymbol: NodeFactory.makeSymbol('RawEqualQ'),
};

function makeAllSymbolsList(): Expr[] {
  const allSymbolsList: Expr[] = [];
  for (const key in allSymbolsMap) {
    allSymbolsList.push(allSymbolsMap[key]);
  }
  return allSymbolsList;
}

// 全体符号集
export const allSymbols: Expr[] = makeAllSymbolsList();

// 全体带非标准求值标志的符号集合
function makeNonStandardSymbolSet(): Set<string> {
  const sblset: Set<string> = new Set<string>();
  for (const sbl of allSymbols) {
    if (
      sbl.nodeType === 'terminal' &&
      sbl.expressionType === 'symbol' &&
      sbl.nonStandard
    ) {
      sblset.add(sbl.value);
    }
  }

  return sblset;
}
export const allNonStandardSymbolsSet: Set<string> = makeNonStandardSymbolSet();

// 返回一个 Blank Pattern
export function Blank(): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.BlankSymbol,
    children: [],
  };
}

// 返回一个 Typed Blank Pattern
export function TypedBlank(h: Expr): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.BlankSymbol,
    children: [h],
  };
}

// 返回一个 BlankSequence Pattern
export function BlankSequence(): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.BlankSequenceSymbol,
    children: [],
  };
}

// 返回一个 BlankSequenceNull Pattern
export function BlankSequenceNull(): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.BlankNullSequenceSymbol,
    children: [],
  };
}

// 返回一个命名 Pattern
export function NamedPattern(identifier: string, pattern: Expr): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.PatternSymbol,
    children: [NodeFactory.makeSymbol(identifier), pattern],
  };
}

// 返回一个 Sequence
export function Sequence(children: Expr[]): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.SequenceSymbol,
    children,
  };
}

// 返回一个 NumberExpressionType[]
export function NumberExpressionType(): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.NumberExpressionTypeSymbol,
    children: [],
  };
}

// 返回一个数值型一元运算 Pattern
class UnaryOperationPatternFactory {
  public static makePattern(
    headExpr: Expr,
    valueFunction: (a: number) => number,
  ): Definition {
    return {
      pattern: {
        nodeType: 'nonTerminal',
        head: headExpr,
        children: [Blank()],
      },
      action: (node, evaluator, context) => {
        if (node.nodeType === 'nonTerminal' && node.children.length === 1) {
          const v1 = node.children[0];
          if (v1.nodeType === 'terminal' && v1.expressionType === 'number') {
            return {
              nodeType: 'terminal',
              expressionType: 'number',
              head: allSymbolsMap.NumberSymbol,
              value: valueFunction(v1.value),
            };
          }

          const nodeCopy = ExprHelper.shallowCopy(node) as typeof node;
          nodeCopy.children[0] = evaluator.evaluate(
            nodeCopy.children[0],
            context,
          );
          return nodeCopy;
        }

        return node;
      },
      displayName: 'x :-> f x',
    };
  }
}

// 返回一个数值型二元运算 Pattern
class BinaryOperationPatternFactory {
  public static makePattern(
    headExpr: Expr,
    valueFunction: (a: number, b: number) => number,
  ): Definition {
    return {
      pattern: {
        nodeType: 'nonTerminal',
        head: headExpr,
        children: [Blank(), Blank()],
      },
      action: (node, evaluator, context) => {
        if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
          if (
            node.children[0].nodeType === 'terminal' &&
            node.children[0].expressionType === 'number' &&
            node.children[1].nodeType === 'terminal' &&
            node.children[1].expressionType === 'number'
          ) {
            return {
              nodeType: 'terminal',
              expressionType: 'number',
              value: valueFunction(
                node.children[0].value,
                node.children[1].value,
              ),
              head: allSymbolsMap.NumberSymbol,
            };
          }

          const nodeCopy = ExprHelper.shallowCopy(node) as typeof node;
          nodeCopy.children[0] = evaluator.evaluate(
            nodeCopy.children[0],
            context,
          );
          nodeCopy.children[1] = evaluator.evaluate(
            nodeCopy.children[1],
            context,
          );
          return nodeCopy;
        }
        return node;
      },
      displayName: '(x, y) :-> f (x, y)',
    };
  }
}

// builtInDefinition 是按非标准程序求值的
export const builtInDefinitions: Definition[] = [
  // If[cond, trueClause, falseClause], 走特殊求值流程
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.IfSymbol,
      children: [Blank(), Blank(), Blank()],
    },
    action: (node, evaluator, context) => {
      if (
        node.head.nodeType === 'terminal' &&
        node.head.expressionType === 'symbol' &&
        node.head.value === 'If' &&
        node.nodeType === 'nonTerminal' &&
        node.children.length === 3
      ) {
        node.children[0] = evaluator.evaluate(node.children[0], context);
        const cond = node.children[0];
        if (
          cond.nodeType === 'terminal' &&
          cond.expressionType === 'boolean' &&
          cond.value !== false
        ) {
          return evaluator.evaluate(node.children[1], context);
        } else {
          return evaluator.evaluate(node.children[2], context);
        }
      }

      logErrorAndExit('IF[_, _, _]');
    },
    displayName: 'IF[x, y, z] -> ?',
  },

  // Head[x:_] := x 的 头部, 走特殊求值流程
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.HeadSymbol,
      children: [Blank()],
    },
    action: (node, evaluator, context) => {
      if (
        node.nodeType === 'nonTerminal' &&
        node.head.nodeType === 'terminal' &&
        node.head.expressionType === 'symbol' &&
        node.head.value === 'Head' &&
        node.children.length === 1
      ) {
        return evaluator.evaluate(node.children[0], context);
      }
      logErrorAndExit('Head[_]');
    },
    displayName: 'Head[x] -> ?',
  },

  // 定义相等判断
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.EqualQSymbol,
      children: [Blank(), Blank()],
    },
    action: (node, evaluator, context) => {
      if (
        node.head.nodeType === 'terminal' &&
        node.head.expressionType === 'symbol' &&
        node.head.value === 'EqualQ' &&
        node.nodeType === 'nonTerminal' &&
        node.children.length === 2
      ) {
        node.children[0] = evaluator.evaluate(node.children[0], context);
        node.children[1] = evaluator.evaluate(node.children[1], context);

        if (ExprHelper.rawEqualQ([node.children[0]], [node.children[1]])) {
          return True;
        } else {
          return False;
        }
      }

      logErrorAndExit('EqualQ[_, _]');
    },
    displayName: 'EqualQ[x, y] -> ?',
  },

  // 立即赋值 Assign[lhs, rhs], 走特殊求值流程，避免再对 lhs 求值
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.AssignSymbol,
      children: [Blank(), Blank()],
    },
    action: (node, evaluator, _) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
        return evaluator.assign({
          pattern: node.children[0],
          value: node.children[1],
        });
      }

      logErrorAndExit('Assign[_, _]');
    },
    displayName: 'Assign[lhs, rhs] -> rhs',
  },

  // 延迟赋值 AssignDelayed[lhs, rhs], 走特殊求值流程，
  // 这是因为在 AssignDelayed 下面，lhs 和 rhs 都不宜被求值，毕竟 AssignDelayed 的含义是「延迟赋值」。
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.AssignDelayedSymbol,
      children: [Blank(), Blank()],
    },
    action: (node, evaluator, _) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
        return evaluator.assignDelayed({
          pattern: node.children[0],
          value: node.children[1],
        });
      }
      logErrorAndExit('AssignDelayed[_, _]');
    },
    displayName: 'AssignDelayed[lhs, rhs] -> Nothing',
  },

  // 清除赋值 ClearAssign[x]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.ClearAssignSymbol,
      children: [Blank()],
    },
    action: (node, evaluator, _) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 1) {
        return evaluator.clearAssign(node.children[0]);
      }

      logErrorAndExit('ClearAssign[x]');
    },
    displayName: 'ClearAssign[x] -> ?',
  },

  // 清除延迟赋值 ClearDelayedAssign[x]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.ClearDelayedAssignSymbol,
      children: [Blank()],
    },
    action: (node, evaluator, _) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 1) {
        return evaluator.clearDelayedAssign(node.children[0]);
      }
      logErrorAndExit('ClearDelayedAssign[_]');
    },
    displayName: 'ClearDelayedAssign[x] -> ?',
  },

  // 二元加法
  BinaryOperationPatternFactory.makePattern(
    allSymbolsMap.PlusSymbol,
    (a, b) => a + b,
  ),

  // 二元减法
  BinaryOperationPatternFactory.makePattern(
    allSymbolsMap.MinusSymbol,
    (a, b) => a - b,
  ),

  // 二元乘法
  BinaryOperationPatternFactory.makePattern(
    allSymbolsMap.TimesSymbol,
    (a, b) => a * b,
  ),

  // 二元除法
  BinaryOperationPatternFactory.makePattern(
    allSymbolsMap.DivideSymbol,
    (a, b) => a / b,
  ),

  // 二元取余数
  BinaryOperationPatternFactory.makePattern(
    allSymbolsMap.RemainderSymbol,
    (a, b) => a % b,
  ),

  // 二元指数运算
  BinaryOperationPatternFactory.makePattern(
    allSymbolsMap.RemainderSymbol,
    (a, b) => Math.pow(a, b),
  ),

  // 一元取负数运算
  UnaryOperationPatternFactory.makePattern(
    allSymbolsMap.NegativeSymbol,
    (a) => 0 - a,
  ),

  // 一元自然指数运算
  UnaryOperationPatternFactory.makePattern(allSymbolsMap.ESymbol, (a) =>
    Math.exp(a),
  ),

  // 一元自然对数运算
  UnaryOperationPatternFactory.makePattern(allSymbolsMap.LnSymbol, (a) =>
    Math.log(a),
  ),
];
