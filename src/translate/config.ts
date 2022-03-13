/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { concatAll, map, of, zip } from 'rxjs';
import { ExprHelper, Neo } from 'src/helpers/expr-helpers';
import { Definition, Expr, IContext, NonTerminalExpr } from './interfaces';

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
    nonStandard: true,
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

  // 函数符号
  FunctionSymbol: NodeFactory.makeSymbol('Function', true),

  // 模式匹配判定符号
  MatchQSymbol: NodeFactory.makeSymbol('MatchQ', true),

  // 长度符号
  LengthSymbol: NodeFactory.makeSymbol('Length', true),

  // 剩余部分负号
  RestPartSymbol: NodeFactory.makeSymbol('RestPart', true),

  // 或者符号
  OrSymbol: NodeFactory.makeSymbol('Or', true),

  // 数值符号
  NumberSymbol: NodeFactory.makeSymbol('Number', true),

  // 赋值符号
  AssignSymbol: NodeFactory.makeSymbol('Assign', true),

  // 延迟赋值符号
  AssignDelayedSymbol: NodeFactory.makeSymbol('AssignDelayed', true),

  // 清除赋值符号
  ClearAssignSymbol: NodeFactory.makeSymbol('ClearAssign', true),

  // 清除延迟赋值
  ClearDelayedAssignSymbol: NodeFactory.makeSymbol('ClearDelayedAssign', true),

  // 取负符号
  NegativeSymbol: NodeFactory.makeSymbol('Negative', true),

  // 平方符号
  SquareSymbol: NodeFactory.makeSymbol('Square', true),

  // 相等判断符号
  EqualQSymbol: NodeFactory.makeSymbol('EqualQ', true),

  // 严格大于判定符号
  GreaterThanSymbol: NodeFactory.makeSymbol('GreaterThan', true),

  // 严格小于判定符号
  LessThanSymbol: NodeFactory.makeSymbol('LessThan', true),

  // 严格不小于判定符号
  GreaterThanOrEqualSymbol: NodeFactory.makeSymbol('GreaterThanOrEqual', true),

  // 严格不大于判定符号
  LessThanOrEqualSymbol: NodeFactory.makeSymbol('LessThanOrEqual', true),

  // 相加符号
  PlusSymbol: NodeFactory.makeSymbol('Plus', true),

  // 相减符号
  MinusSymbol: NodeFactory.makeSymbol('Minus', true),

  // 相乘符号
  TimesSymbol: NodeFactory.makeSymbol('Times', true),

  // 相除符号
  DivideSymbol: NodeFactory.makeSymbol('Divide', true),

  // 取余数符号
  RemainderSymbol: NodeFactory.makeSymbol('Remainder', true),

  // 幂次运算符号
  PowerSymbol: NodeFactory.makeSymbol('Power', true),

  // 一元自然指数幂符号
  ESymbol: NodeFactory.makeSymbol('E', true),

  // 字符串符号
  StringSymbol: NodeFactory.makeSymbol('String', true),

  // Sequence 符号
  SequenceSymbol: NodeFactory.makeSymbol('Sequence', true),

  // List 符号
  ListSymbol: NodeFactory.makeSymbol('List', true),

  // Head 符号
  HeadSymbol: NodeFactory.makeSymbol('Head', true),

  // Pattern 符号
  PatternSymbol: NodeFactory.makeSymbol('Pattern', true),

  // Nothing 符号
  NothingSymbol: NodeFactory.makeSymbol('Nothing', true),

  // Blank 符号
  BlankSymbol: NodeFactory.makeSymbol('Blank', true),

  // True 符号
  TrueSymbol: NodeFactory.makeSymbol('True', true),

  // False 符号
  FalseSymbol: NodeFactory.makeSymbol('False', true),

  // NumberExpressionType 符号
  NumberExpressionTypeSymbol: NodeFactory.makeSymbol(
    'NumberExpressionType',
    true,
  ),

  // 自然对数符号
  LnSymbol: NodeFactory.makeSymbol('Ln', true),

  // 对数符号
  LogSymbol: NodeFactory.makeSymbol('Log', true),

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

  // SwitchToMultilineInputMode 符号
  MultilineModeSymbol: NodeFactory.makeSymbol('MultilineMode', true),

  // SwitchToSingleLineInputMode 符号
  SingleLineInputModeSymbol: NodeFactory.makeSymbol(
    'SingleLineInputMode',
    true,
  ),

  // Rule 符号
  RuleSymbol: NodeFactory.makeSymbol('Rule', true),

  // CurrentInputFlushSentinel 符号
  currentInputFlushSentinelSymbol: NodeFactory.makeSymbol(
    'CurrentInputFlushSentinel',
    true,
  ),

  // First 符号
  FirstSymbol: NodeFactory.makeSymbol('First', true),

  // Table 符号
  TableSymbol: NodeFactory.makeSymbol('Table', true),
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
export function BlankExpr(): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.BlankSymbol,
    children: [],
  };
}

// 返回一个 Typed Blank Pattern
export function TypedBlankExpr(h: Expr): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.BlankSymbol,
    children: [h],
  };
}

// 返回一个 BlankSequence Pattern
export function BlankSequenceExpr(): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.BlankSequenceSymbol,
    children: [],
  };
}

// 返回一个 BlankSequenceNull Pattern
export function BlankNullSequenceExpr(): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.BlankNullSequenceSymbol,
    children: [],
  };
}

// 返回一个 BlankNullSequence[h] Pattern
export function TypedBlankNullSequenceExpr(headExpected: Expr): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.BlankNullSequenceSymbol,
    children: [headExpected],
  };
}

// 返回一个 BlankSequence[h] Pattern
export function TypedBlankSequenceExpr(headExpected: Expr): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.BlankSequenceSymbol,
    children: [headExpected],
  };
}

// 返回一个命名 Pattern
export function NamedPatternExpr(identifier: string, pattern: Expr): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.PatternSymbol,
    children: [NodeFactory.makeSymbol(identifier), pattern],
  };
}

// 返回一个 Sequence
export function SequenceExpr(children: Expr[]): Expr {
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

// 返回一个字符串 Expr
export function StringExpr(content: string): Expr {
  return {
    nodeType: 'terminal',
    expressionType: 'string',
    head: allSymbolsMap.StringSymbol,
    value: content,
  };
}

// 返回一个数字 Expr
export function NumberExpr(value: number): Expr {
  return {
    nodeType: 'terminal',
    expressionType: 'number',
    head: allSymbolsMap.NumberSymbol,
    value: value,
  };
}

// 返回一个 List Expr
export function ListExpr(elements: Expr[]): Expr {
  return {
    nodeType: 'nonTerminal',
    children: elements,
    head: allSymbolsMap.ListSymbol,
  };
}

// 返回一个 Rule
export function RuleExpr(keyExpr: Expr, valueExpr: Expr): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.RuleSymbol,
    children: [keyExpr, valueExpr],
  };
}

export function MakeNonTerminalExpr(headExpr: Expr, children: Expr[]): Expr {
  return {
    nodeType: 'nonTerminal',
    head: headExpr,
    children,
  };
}

export function FunctionExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.FunctionSymbol, children);
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
        children: [BlankExpr()],
      },
      action: (node, evaluator, context) => {
        if (node.nodeType === 'nonTerminal' && node.children.length === 1) {
          const v1 = node.children[0];
          if (v1.nodeType === 'terminal' && v1.expressionType === 'number') {
            return of(NumberExpr(valueFunction(v1.value)));
          }

          return of(ExprHelper.shallowCopy(node) as typeof node).pipe(
            map((node) => {
              return evaluator.evaluate(node.children[0], context).pipe(
                map((child) => {
                  node.children[0] = child;
                  return node as Expr;
                }),
              );
            }),
            concatAll(),
          );
        }

        return of(node);
      },
      displayName: 'x :-> f x',
    };
  }
}

// 返回一个二元运算 Pattern
class BinaryExprPatternFactory {
  public static makePattern(
    headExpr: Expr,
    valueFunction: (a: number, b: number) => Expr,
  ): Definition {
    return {
      pattern: {
        nodeType: 'nonTerminal',
        head: headExpr,
        children: [BlankExpr(), BlankExpr()],
      },
      action: (node, evaluator, context) => {
        if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
          if (
            node.children[0].nodeType === 'terminal' &&
            node.children[0].expressionType === 'number' &&
            node.children[1].nodeType === 'terminal' &&
            node.children[1].expressionType === 'number'
          ) {
            const x = node.children[0].value;
            const y = node.children[1].value;
            return of(valueFunction(x, y));
          }

          return of(ExprHelper.shallowCopy(node) as typeof node).pipe(
            map((node) =>
              zip([
                evaluator.evaluate(node.children[0], context),
                evaluator.evaluate(node.children[1], context),
              ]).pipe(
                map(([child1, child2]) => {
                  node.children[0] = child1;
                  node.children[1] = child2;
                  return node as Expr;
                }),
              ),
            ),
            concatAll(),
          );
        }
        return of(node);
      },
      displayName: '(x, y) :-> f (x, y)',
    };
  }
}

// 返回一个数值型二元运算 Pattern
class BinaryOperationPatternFactory {
  public static makePattern(
    headExpr: Expr,
    valueFunction: (a: number, b: number) => number,
  ): Definition {
    return BinaryExprPatternFactory.makePattern(headExpr, (a, b) => {
      return NumberExpr(valueFunction(a, b));
    });
  }
}

// builtInDefinition 是按非标准程序求值的
export const builtInDefinitions: Definition[] = [
  // _[___, _Sequence, ___]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: BlankExpr(),
      children: [
        BlankNullSequenceExpr(),
        TypedBlankExpr(allSymbolsMap.SequenceSymbol),
        BlankNullSequenceExpr(),
      ],
    },
    action: (node, _, __) => {
      if (node.nodeType === 'nonTerminal') {
        const children: Expr[] = [];
        for (const child of node.children) {
          if (
            child.nodeType === 'nonTerminal' &&
            child.head.nodeType === 'terminal' &&
            child.head.expressionType === 'symbol' &&
            child.head.value === 'Sequence'
          ) {
            for (const childOfSequence of child.children) {
              children.push(childOfSequence);
            }
          } else {
            children.push(child);
          }
        }

        node.children = children;
      }

      return of(node);
    },
    displayName: '_[___, _Sequence, ___] -> ?',
  },

  // List[...]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.ListSymbol,
      children: [BlankNullSequenceExpr()],
    },
    action: (expr, evaluator, context) => {
      if (expr.nodeType === 'nonTerminal') {
        if (expr.children.length > 0) {
          return zip(
            expr.children.map((child) => evaluator.evaluate(child, context)),
          ).pipe(
            map((children) => {
              expr.children = children;
              return expr;
            }),
          );
        }
      }

      return of(expr);
    },
    displayName: 'List[___] -> ?',
  },

  // Length
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.LengthSymbol,
      children: [BlankExpr()],
    },
    action: (expr, evaluator, context) => {
      if (expr.nodeType === 'nonTerminal') {
        if (expr.children.length === 1) {
          const x = expr.children[0];
          if (x.nodeType === 'nonTerminal') {
            return of(NumberExpr(x.children.length));
          }
        }
      }

      return of(expr);
    },
    displayName: 'Length[_] -> ?',
  },

  // First
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.FirstSymbol,
      children: [BlankExpr()],
    },
    action: (expr, evaluator, context) => {
      if (expr.nodeType === 'nonTerminal') {
        if (expr.children.length === 1) {
          const x = expr.children[0];
          return evaluator.evaluate(x, context).pipe(
            map((x) => {
              if (x.nodeType === 'nonTerminal') {
                if (x.children.length >= 1) {
                  return x.children[0];
                }
              }
              return expr;
            }),
          );
        }
      }

      return of(expr);
    },
    displayName: 'First[_] -> ?',
  },

  // RestPart
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.RestPartSymbol,
      children: [BlankExpr()],
    },
    action: (expr, evaluator, context) => {
      if (expr.nodeType === 'nonTerminal') {
        if (expr.children.length === 1) {
          const x = expr.children[0];
          return evaluator.evaluate(x, context).pipe(
            map((x) => {
              if (x.nodeType === 'nonTerminal') {
                if (x.children.length >= 1) {
                  return ListExpr(x.children.slice(1, x.children.length));
                }
              }
              return expr;
            }),
          );
        }
      }

      return of(expr);
    },
    displayName: 'RestPart[_] -> ?',
  },

  // MatchQ
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.MatchQSymbol,
      children: [BlankExpr(), BlankExpr()],
    },
    action: (expr, evaluator, context) => {
      if (expr.nodeType === 'nonTerminal' && expr.children.length === 2) {
        if (Neo.patternMatch([expr.children[0]], [expr.children[1]]).pass) {
          return of(True);
        } else {
          return of(False);
        }
      }
      return of(expr);
    },
    displayName: 'MatchQ[_, _] -> ?',
  },

  // Table[expr, { { variables }, initial, step, max }]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.TableSymbol,
      children: [
        BlankExpr(),
        {
          nodeType: 'nonTerminal',
          head: allSymbolsMap.ListSymbol,
          children: [
            {
              nodeType: 'nonTerminal',
              head: allSymbolsMap.ListSymbol,
              children: [TypedBlankSequenceExpr(allSymbolsMap.SymbolSymbol)],
            },
            BlankExpr(),
            BlankExpr(),
            BlankExpr(),
          ],
        },
      ],
    },
    action: (expr, evaluator, context) => {
      return of(NodeFactory.makeSymbol('abc'));
      return of(expr);
    },
    displayName: 'Table[_, {_, _, _}] -> {?}',
  },

  // Sequence[_]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.SequenceSymbol,
      children: [BlankExpr()],
    },
    action: (node, _, __) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 1) {
        return of(node.children[0]);
      } else {
        return of(node);
      }
    },
    displayName: 'Sequence[x] -> x',
  },

  // 把 True 符号替换为 True, False 符号替换为 False
  {
    pattern: allSymbolsMap.TrueSymbol,
    action: (_, __, ___) => {
      return of(True);
    },
    displayName: 'True -> True',
  },
  {
    pattern: allSymbolsMap.FalseSymbol,
    action: (_, __, ___) => {
      return of(False);
    },
    displayName: 'False -> False',
  },

  // Or[cond1, cond2]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.OrSymbol,
      children: [BlankExpr(), BlankExpr()],
    },
    action: (node, evaluator, context) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
        return zip([
          evaluator.evaluate(node.children[0], context),
          evaluator.evaluate(node.children[1], context),
        ]).pipe(
          map(([cond1, cond2]) => {
            if (
              cond1.nodeType === 'terminal' &&
              cond1.expressionType === 'boolean' &&
              cond1.value === true
            ) {
              return True;
            } else if (
              cond2.nodeType === 'terminal' &&
              cond2.expressionType === 'boolean' &&
              cond2.value === true
            ) {
              return True;
            } else {
              return False;
            }
          }),
        );
      }

      return of(node);
    },
    displayName: 'Or[_, _] -> ?',
  },

  // If[cond, trueClause, falseClause], 走特殊求值流程
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.IfSymbol,
      children: [BlankExpr(), BlankExpr(), BlankExpr()],
    },
    action: (expr, evaluator, context) => {
      return of(expr).pipe(
        map((expr) => {
          if (
            expr.head.nodeType === 'terminal' &&
            expr.head.expressionType === 'symbol' &&
            expr.head.value === 'If' &&
            expr.nodeType === 'nonTerminal' &&
            expr.children.length === 3
          ) {
            return evaluator.evaluate(expr.children[0], context).pipe(
              map((cond) => {
                if (
                  cond.nodeType === 'terminal' &&
                  cond.expressionType === 'boolean' &&
                  cond.value === true
                ) {
                  return expr.children[1];
                } else {
                  return expr.children[2];
                }
              }),
            );
          } else {
            return of(expr);
          }
        }),
        concatAll(),
      );
    },
    displayName: 'IF[x, y, z] -> ?',
  },

  // Head[x:_] := x 的 头部, 走特殊求值流程
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.HeadSymbol,
      children: [BlankExpr()],
    },
    action: (node, _, __) => {
      if (
        node.nodeType === 'nonTerminal' &&
        node.head.nodeType === 'terminal' &&
        node.head.expressionType === 'symbol' &&
        node.head.value === 'Head' &&
        node.children.length === 1
      ) {
        return of(node.children[0]);
      }
      return of(node);
    },
    displayName: 'Head[x] -> ?',
  },

  // 定义相等判断
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.EqualQSymbol,
      children: [BlankExpr(), BlankExpr()],
    },
    action: (node, evaluator, context) => {
      if (
        node.head.nodeType === 'terminal' &&
        node.head.expressionType === 'symbol' &&
        node.head.value === 'EqualQ' &&
        node.nodeType === 'nonTerminal' &&
        node.children.length === 2
      ) {
        const lhs$ = evaluator.evaluate(node.children[0], context);
        const rhs$ = evaluator.evaluate(node.children[1], context);
        return zip([lhs$, rhs$]).pipe(
          map(([lhs, rhs]) => {
            if (ExprHelper.rawEqualQ([lhs], [rhs])) {
              return True as Expr;
            } else {
              return False as Expr;
            }
          }),
        );
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
      children: [BlankExpr(), BlankExpr()],
    },
    action: (node, evaluator, context) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
        const key = node.children[0];
        const value = node.children[1];
        return evaluator.evaluate(value, context).pipe(
          map((evaluatedRhs) => {
            evaluator.assign({ pattern: key, value: of(value) });
            return evaluatedRhs;
          }),
        );
      }

      return of(node);
    },
    displayName: 'Assign[lhs, rhs] -> rhs',
  },

  // 延迟赋值 AssignDelayed[lhs, rhs], 走特殊求值流程，
  // 这是因为在 AssignDelayed 下面，lhs 和 rhs 都不宜被求值，毕竟 AssignDelayed 的含义是「延迟赋值」。
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.AssignDelayedSymbol,
      children: [BlankExpr(), BlankExpr()],
    },
    action: (node, evaluator, _) => {
      if (node.nodeType === 'nonTerminal' && node.children.length === 2) {
        return evaluator.assignDelayed({
          pattern: node.children[0],
          value: of(node.children[1]),
        });
      }
      return of(node);
    },
    displayName: 'AssignDelayed[lhs, rhs] -> Nothing',
  },

  // 清除赋值 ClearAssign[x]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.ClearAssignSymbol,
      children: [BlankExpr()],
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
      children: [BlankExpr()],
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

  // 平方运算
  UnaryOperationPatternFactory.makePattern(
    allSymbolsMap.SquareSymbol,
    (a) => a * a,
  ),

  // 比较大小
  BinaryExprPatternFactory.makePattern(allSymbolsMap.LessThanSymbol, (a, b) =>
    a < b ? True : False,
  ),
  BinaryExprPatternFactory.makePattern(
    allSymbolsMap.LessThanOrEqualSymbol,
    (a, b) => (a <= b ? True : False),
  ),
  BinaryExprPatternFactory.makePattern(
    allSymbolsMap.GreaterThanSymbol,
    (a, b) => (a > b ? True : False),
  ),
  BinaryExprPatternFactory.makePattern(
    allSymbolsMap.GreaterThanOrEqualSymbol,
    (a, b) => (a >= b ? True : False),
  ),

  // 匿名函数
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: FunctionExpr([BlankSequenceExpr()]),
      children: [BlankNullSequenceExpr()],
    },
    action: (expr, evaluator, context) => {
      const lambaCallExpr = expr as NonTerminalExpr;
      const functionExpr = lambaCallExpr.head as any as NonTerminalExpr;
      const patternPart = functionExpr.children.slice(
        0,
        functionExpr.children.length - 1,
      );
      const bodyPart = functionExpr.children[functionExpr.children.length - 1];
      const match = Neo.patternMatch(lambaCallExpr.children, patternPart);
      if (!match.pass) {
        return of(expr);
      }

      const temporaryDefinitions: Definition[] = [];
      for (const key in match.namedResult) {
        const keyExpr = NodeFactory.makeSymbol(key);
        temporaryDefinitions.push({
          pattern: keyExpr,
          action: (_, __, ___) => of(SequenceExpr(match.namedResult[key])),
          displayName: ExprHelper.nodeToString(keyExpr) + ' -> ?',
        });
      }
      const temporaryCtx: IContext = {
        parent: context,
        definitions: {
          ...context.definitions,
          arguments: temporaryDefinitions,
        },
      };

      return evaluator.evaluate(bodyPart, temporaryCtx);
    },
    displayName: 'Function[__][___] -> ?',
  },
];
