/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
  asapScheduler,
  catchError,
  concatAll,
  filter,
  first,
  map,
  Observable,
  observeOn,
  of,
  timeout,
  zip,
} from 'rxjs';
import { EvaluateHelper } from 'src/helpers/evalaute-helper';
import { ExprHelper, Neo } from 'src/helpers/expr-helpers';
import {
  Definition,
  Expr,
  IContext,
  NonTerminalExpr,
  TerminalExpr,
  TerminalNumberExpr,
} from './interfaces';

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
  FunctionSymbol: NodeFactory.makeSymbol('Function'),

  // 模式匹配判定符号
  MatchQSymbol: NodeFactory.makeSymbol('MatchQ', true),

  // 长度符号
  LengthSymbol: NodeFactory.makeSymbol('Length'),

  // Or 符号
  OrSymbol: NodeFactory.makeSymbol('Or', true),

  // And 符号
  AndSymbol: NodeFactory.makeSymbol('And', true),

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
  EqualQSymbol: NodeFactory.makeSymbol('EqualQ'),

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
  ListSymbol: NodeFactory.makeSymbol('List'),

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

  // RuleDelayed 符号
  RuleDelayedSymbol: NodeFactory.makeSymbol('RuleDelayed', true),

  // Not 符号
  NotSymbol: NodeFactory.makeSymbol('Not'),

  // CurrentInputFlushSentinel 符号
  currentInputFlushSentinelSymbol: NodeFactory.makeSymbol(
    'CurrentInputFlushSentinel',
    true,
  ),

  // First 符号
  FirstSymbol: NodeFactory.makeSymbol('First'),

  // Table 符号
  TableSymbol: NodeFactory.makeSymbol('Table', true),

  // Map 符号
  MapSymbol: NodeFactory.makeSymbol('Map', true),

  // Reduce 符号
  ReduceSymbol: NodeFactory.makeSymbol('Reduce', true),

  // Seq 符号
  SeqSymbol: NodeFactory.makeSymbol('Seq'),

  // ListJoin 符号
  ListJoinSymbol: NodeFactory.makeSymbol('ListJoin'),

  // ListTake 符号
  ListTakeSymbol: NodeFactory.makeSymbol('ListTake', true),

  // ListSlice 符号
  ListSlice: NodeFactory.makeSymbol('ListSlice', true),

  // Let 符号
  LetSymbol: NodeFactory.makeSymbol('Let', true),

  // Filter 符号
  FilterSymbol: NodeFactory.makeSymbol('Filter', true),

  // ReplaceAll 符号
  ReplaceAllSymbol: NodeFactory.makeSymbol('ReplaceAll', true),

  // AssociationList 符号
  AssociationListSymbol: NodeFactory.makeSymbol('AssociationList', true),

  // Factorial 符号
  FactorialSymbol: NodeFactory.makeSymbol('Factorial', true),

  // DoubleFactorial 符号
  DoubleFactorialSymbol: NodeFactory.makeSymbol('DoubleFactorial', true),

  // Float 符号
  FloatSymbol: NodeFactory.makeSymbol('Float', true),

  // ScientificNotation 符号
  ScientificNotationSymbol: NodeFactory.makeSymbol('ScientificNotation', true),

  // Pi 符号
  PiSymbol: NodeFactory.makeSymbol('Pi', true),

  // Exp 符号
  ExpSymbol: NodeFactory.makeSymbol('Exp', true),

  // Sine 符号
  SineSymbol: NodeFactory.makeSymbol('Sine', true),

  // CoSine 符号
  CoSineSymbol: NodeFactory.makeSymbol('CoSine', true),

  // Tangent 符号
  TangentSymbol: NodeFactory.makeSymbol('Tangent', true),

  // 绝对值符号
  AbsSymbol: NodeFactory.makeSymbol('Abs', true),

  // 随机符号
  RandomSymbol: NodeFactory.makeSymbol('Random', true),

  // Rest 符号
  RestSymbol: NodeFactory.makeSymbol('Rest'),

  // Lambda 符号
  LambdaSymbol: NodeFactory.makeSymbol('Lambda'),
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
export function RuleExpr(children: Expr[]): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.RuleSymbol,
    children,
  };
}

// 返回一个 RuleDelayedExpr
export function RuleDelayedExpr(children: Expr[]): Expr {
  return {
    nodeType: 'nonTerminal',
    head: allSymbolsMap.RuleDelayedSymbol,
    children,
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

export function ReduceExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.ReduceSymbol, children);
}

export function SeqExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.SeqSymbol, children);
}

export function MapExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.MapSymbol, children);
}

export function ListJoinExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.ListJoinSymbol, children);
}

export function LetExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.LetSymbol, children);
}

export function FilterExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.FilterSymbol, children);
}

export function IfExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.IfSymbol, children);
}

export function OrExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.OrSymbol, children);
}

export function AndExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.AndSymbol, children);
}

export function AssignDelayedExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.AssignDelayedSymbol, children);
}

export function AssignExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.AssignSymbol, children);
}

export function ReplaceAllExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.ReplaceAllSymbol, children);
}

export function NotExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.NotSymbol, children);
}

export function GreaterThanExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.GreaterThanSymbol, children);
}

export function GreaterThanOrEqualExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.GreaterThanOrEqualSymbol, children);
}

export function LessThanOrEqualExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.LessThanOrEqualSymbol, children);
}

export function LessThanExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.LessThanSymbol, children);
}

export function EqualQExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.EqualQSymbol, children);
}

export function PlusExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.PlusSymbol, children);
}

export function MinusExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.MinusSymbol, children);
}

export function TimesExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.TimesSymbol, children);
}

export function DivideExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.DivideSymbol, children);
}

export function RemainderExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.RemainderSymbol, children);
}

export function NegativeExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.NegativeSymbol, children);
}

export function PowerExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.PowerSymbol, children);
}

export function PatternExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.PatternSymbol, children);
}

export function BlankExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.BlankSymbol, children);
}

export function BlankSequenceExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.BlankSequenceSymbol, children);
}

export function BlankNullSequenceExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.BlankNullSequenceSymbol, children);
}

export function TakeExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.TakeSymbol, children);
}

export function AssociationListExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.AssociationListSymbol, children);
}

export function FactorialExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.FactorialSymbol, children);
}

export function DoubleFactorialExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.DoubleFactorialSymbol, children);
}

export function FloatExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.FloatSymbol, children);
}

export function ScientificNotationExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.ScientificNotationSymbol, children);
}

export function RandomExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.RandomSymbol, children);
}

export function RestExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.RestSymbol, children);
}

export function LengthExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.LengthSymbol, children);
}

export function FirstExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.FirstSymbol, children);
}

export function LambdaExpr(children: Expr[]): Expr {
  return MakeNonTerminalExpr(allSymbolsMap.LambdaSymbol, children);
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
        children: [BlankExpr([])],
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
        children: [BlankExpr([]), BlankExpr([])],
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
  // Sequence[_]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.SequenceSymbol,
      children: [BlankExpr([])],
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

  // _[___, _Sequence, ___]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: BlankExpr([]),
      children: [
        BlankNullSequenceExpr([]),
        BlankExpr([allSymbolsMap.SequenceSymbol]),
        BlankNullSequenceExpr([]),
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

  // Length[_List]
  {
    pattern: LengthExpr([BlankExpr([allSymbolsMap.ListSymbol])]),
    action: (expr, __, ___) => {
      const lengthExpr = expr as NonTerminalExpr;
      const listExpr = lengthExpr.children[0] as NonTerminalExpr;
      return of(NumberExpr(listExpr.children.length));
    },
    displayName: 'Length[{}] -> 0',
  },

  // First[nonEmpty_List]
  {
    pattern: FirstExpr([ListExpr([BlankSequenceExpr([])])]),
    action: (expr, evaluator, context) => {
      const firstExpr = expr as NonTerminalExpr;
      const listLike = firstExpr.children[0] as NonTerminalExpr;
      return of(listLike.children[0]);
    },
    displayName: 'First[_] -> ?',
  },

  // Rest[List[]]
  {
    pattern: RestExpr([ListExpr([])]),
    action: (_, __, ___) => of(ListExpr([])),
    displayName: 'Rest[{}] -> {}',
  },

  // Rest[List[__]]
  {
    pattern: RestExpr([ListExpr([BlankSequenceExpr([])])]),
    action: (expr, evaluator, context) => {
      const restPartExpr = expr as NonTerminalExpr;
      const listExpr = restPartExpr.children[0] as NonTerminalExpr;
      const rest = listExpr.children.slice(1, listExpr.children.length);
      return of(ListExpr([...rest]));
    },
    displayName: 'Rest[List[__]] -> ?',
  },

  // MatchQ
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.MatchQSymbol,
      children: [BlankExpr([]), BlankExpr([])],
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
    pattern: OrExpr([BlankExpr([]), BlankExpr([])]),
    action: (expr, _, __) => {
      const orExpr = expr as NonTerminalExpr;
      return of(
        IfExpr([
          orExpr.children[0],
          True,
          IfExpr([orExpr.children[1], True, False]),
        ]),
      );
    },
    displayName: 'Or[_, _] -> ?',
  },

  // And[cond1, cond2]
  {
    pattern: AndExpr([BlankExpr([]), BlankExpr([])]),
    action: (expr, _, __) => {
      const andExpr = expr as NonTerminalExpr;
      return of(
        IfExpr([
          andExpr.children[0],
          IfExpr([andExpr.children[1], True, False]),
          False,
        ]),
      );
    },
    displayName: 'And[_, _] -> ?',
  },

  {
    pattern: IfExpr([True, BlankExpr([]), BlankExpr([])]),
    action: (expr, _, __) => of((expr as NonTerminalExpr).children[1]),
    displayName: 'If[True, t_, f_] -> t',
  },

  {
    pattern: IfExpr([False, BlankExpr([]), BlankExpr([])]),
    action: (expr, _, __) => of((expr as NonTerminalExpr).children[2]),
    displayName: 'If[False, t_, f_] -> f',
  },

  {
    pattern: IfExpr([BlankExpr([]), BlankExpr([]), BlankExpr([])]),
    action: (expr, evaluator, context) => {
      const ifExpr = expr as NonTerminalExpr;
      const trueC = ifExpr.children[1];
      const falseC = ifExpr.children[2];
      return evaluator
        .evaluate(ifExpr.children[0], context)
        .pipe(map((cond) => IfExpr([cond, trueC, falseC])));
    },
    displayName: 'If[_, _, _] -> ?',
  },

  // Head[x:_] := x 的 头部, 走特殊求值流程
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.HeadSymbol,
      children: [BlankExpr([])],
    },
    action: (node, _, __) => {
      return of(node.head);
    },
    displayName: 'Head[x] -> ?',
  },

  // 定义相等判断
  {
    pattern: EqualQExpr([BlankExpr([]), BlankExpr([])]),
    action: (node, evaluator, context) => {
      const equExpr = node as NonTerminalExpr;
      const lhs = equExpr.children[0];
      const rhs = equExpr.children[1];

      const directEqual = ExprHelper.rawEqualQ([lhs], [rhs]);
      if (directEqual) {
        return of(True);
      } else {
        return of(False);
      }
    },
    displayName: 'EqualQ[x, y] -> ?',
  },

  // 立即赋值 Assign[lhs, rhs], 走特殊求值流程，避免再对 lhs 求值
  {
    pattern: AssignExpr([BlankExpr([]), BlankExpr([])]),
    action: (node, evaluator, context) => {
      const assignExpr = node as NonTerminalExpr;
      const lhs = assignExpr.children[0];
      const rhs = assignExpr.children[1];
      return evaluator.evaluate(rhs, context).pipe(
        map((rhs) => {
          evaluator.assign({ pattern: lhs, value: of(rhs) });
          return rhs;
        }),
      );
    },
    displayName: 'Assign[lhs, rhs] -> rhs',
  },

  // 延迟赋值 AssignDelayed[lhs, rhs], 走特殊求值流程，
  // 这是因为在 AssignDelayed 下面，lhs 和 rhs 都不宜被求值，毕竟 AssignDelayed 的含义是「延迟赋值」。
  {
    pattern: AssignDelayedExpr([BlankExpr([]), BlankExpr([])]),
    action: (node, evaluator, _) => {
      const assignDelayedExpr = node as NonTerminalExpr;
      const lhs = assignDelayedExpr.children[0];
      const rhs = assignDelayedExpr.children[1];
      return evaluator.assignDelayed({ pattern: lhs, value: of(rhs) });
    },
    displayName: 'AssignDelayed[lhs, rhs] -> Nothing',
  },

  // 清除赋值 ClearAssign[x]
  {
    pattern: {
      nodeType: 'nonTerminal',
      head: allSymbolsMap.ClearAssignSymbol,
      children: [BlankExpr([])],
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
      children: [BlankExpr([])],
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

  // 一元自然对数运算
  UnaryOperationPatternFactory.makePattern(allSymbolsMap.LnSymbol, (a) =>
    Math.log(a),
  ),

  // 正弦函数
  UnaryOperationPatternFactory.makePattern(allSymbolsMap.SineSymbol, (a) =>
    Math.sin(a),
  ),

  // 余弦函数
  UnaryOperationPatternFactory.makePattern(allSymbolsMap.CoSineSymbol, (a) =>
    Math.cos(a),
  ),

  // 正切函数
  UnaryOperationPatternFactory.makePattern(allSymbolsMap.TangentSymbol, (a) =>
    Math.tan(a),
  ),

  // 绝对值函数
  UnaryOperationPatternFactory.makePattern(allSymbolsMap.AbsSymbol, (a) =>
    Math.abs(a),
  ),

  // 自然指数
  UnaryOperationPatternFactory.makePattern(allSymbolsMap.ExpSymbol, (a) =>
    Math.exp(a),
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
  // 用法举例：Function[a_, b_, a+b][1, 2]
  {
    pattern: BlankExpr([FunctionExpr([BlankExpr([]), BlankSequenceExpr([])])]),
    action: (expr, evaluator, context) => {
      const functionApplicationExpr = expr as NonTerminalExpr;
      const functionDefinitionExpr =
        functionApplicationExpr.head as NonTerminalExpr;
      const argc = functionDefinitionExpr.children.length;
      const functionBodyExpr = functionDefinitionExpr.children[argc - 1];
      const temporaryCtx: IContext = {
        parent: context,
        definitions: {
          arguments: [],
          fixedAssign: [],
          delayedAssign: [],
          builtin: [],
        },
      };
      const key = LambdaExpr(
        functionDefinitionExpr.children.slice(0, argc - 1),
      );
      temporaryCtx.definitions.arguments.push({
        pattern: key,
        action: (_expr, _evaluator, _context) => {
          return _evaluator.evaluate(functionBodyExpr, _context);
        },
        displayName: ExprHelper.nodeToString(key) + ' -> ?',
      });

      return evaluator.evaluate(
        LambdaExpr(functionApplicationExpr.children),
        temporaryCtx,
      );
    },
    displayName: 'Function[__][___] -> ?',
  },

  // Map
  {
    pattern: MapExpr([BlankExpr([]), BlankExpr([])]),
    action: (expr, evaluator, context) => {
      const mapExpr = expr as NonTerminalExpr;
      const listLikeExpr = mapExpr.children[0];
      const functionExpr = mapExpr.children[1];

      return evaluator.evaluate(listLikeExpr, context).pipe(
        map((listLike) => {
          if (listLike.nodeType === 'terminal') {
            return of(MapExpr([listLike, functionExpr]));
          } else if (listLike.children.length === 0) {
            return of(listLike);
          } else {
            return zip(
              listLike.children.map((child) =>
                evaluator.evaluate(
                  MakeNonTerminalExpr(functionExpr, [child]),
                  context,
                ),
              ),
            ).pipe(
              map((children) => {
                return MakeNonTerminalExpr(listLike.head, children);
              }),
            );
          }
        }),
        concatAll(),
      );
    },
    displayName: 'Map[_, _] -> ?',
  },

  // Reduce
  {
    pattern: ReduceExpr([BlankExpr([]), BlankExpr([]), BlankExpr([])]),
    action: (expr, evaluator, context) => {
      const reduceExpr = expr as NonTerminalExpr;
      const listLike = reduceExpr.children[0];
      const functionLike = reduceExpr.children[1];
      const initialLike = reduceExpr.children[2];
      return evaluator.evaluate(listLike, context).pipe(
        map((listLike) => {
          if (listLike.nodeType === 'terminal') {
            return of(ReduceExpr([listLike, functionLike, initialLike]));
          } else if (listLike.children.length === 0) {
            return of(initialLike);
          } else {
            return of(
              ReduceExpr([
                MakeNonTerminalExpr(
                  listLike.head,
                  listLike.children.slice(1, listLike.children.length),
                ),
                functionLike,
                MakeNonTerminalExpr(functionLike, [
                  initialLike,
                  listLike.children[0],
                ]),
              ]),
            );
          }
        }),
        concatAll(),
      );
    },
    displayName: 'Reduce[_, _, _] -> ?',
  },

  // Seq[_Number]
  {
    pattern: SeqExpr([BlankExpr([allSymbolsMap.NumberSymbol])]),
    action: (expr, _, __) => {
      const seqExpr = expr as NonTerminalExpr;
      const numberLikeExpr = seqExpr.children[0] as TerminalNumberExpr;
      const sequence: number[] = [];
      for (let i = 1; i <= numberLikeExpr.value; i++) {
        sequence.push(i);
      }
      return of(ListExpr(sequence.map((ele) => NumberExpr(ele))));
    },
    displayName: 'Seq[_Number] -> ?',
  },

  // Seq[_Number, _Number]
  {
    pattern: SeqExpr([
      BlankExpr([allSymbolsMap.NumberSymbol]),
      BlankExpr([allSymbolsMap.NumberSymbol]),
    ]),
    action: (expr, _, __) => {
      const seqExpr = expr as NonTerminalExpr;
      const numberLikeExpr1 = seqExpr.children[0] as TerminalNumberExpr;
      const numberLikeExpr2 = seqExpr.children[1] as TerminalNumberExpr;

      const sequence: number[] = [];
      for (let i = numberLikeExpr1.value; i <= numberLikeExpr2.value; i++) {
        sequence.push(i);
      }

      return of(ListExpr(sequence.map((ele) => NumberExpr(ele))));
    },
    displayName: 'Seq[_Number, _Number] -> ?',
  },

  // Seq[_Number, _Number, _Number]
  {
    pattern: SeqExpr([BlankExpr([]), BlankExpr([]), BlankExpr([])]),
    action: (expr, evaluator, context) => {
      const seqExpr = expr as NonTerminalExpr;
      const num1Expr = seqExpr.children[0] as TerminalNumberExpr;
      const num2Expr = seqExpr.children[1] as TerminalNumberExpr;
      const num3Expr = seqExpr.children[2] as TerminalNumberExpr;

      const sequence: number[] = [];
      const start = num1Expr.value;
      const end = num2Expr.value;
      const step = num3Expr.value;
      let x = start;
      while (x <= end) {
        sequence.push(x);
        x = x + step;
      }
      return of(ListExpr(sequence.map((ele) => NumberExpr(ele))));
    },
    displayName: 'Seq[_Number, _Number, _Number] -> ?',
  },

  {
    pattern: ListJoinExpr([BlankSequenceExpr([allSymbolsMap.ListSymbol])]),
    action: (expr, __, ___) => {
      const listJoinExpr = expr as NonTerminalExpr;
      const listExprs = listJoinExpr.children as NonTerminalExpr[];
      const elements: Expr[] = [];
      for (const item of listExprs) {
        for (const subItem of item.children) {
          elements.push(subItem);
        }
      }
      return of(ListExpr(elements));
    },
    displayName: 'ListJoin[_List, _List] -> ?',
  },

  // Let[__]
  {
    pattern: BlankExpr([allSymbolsMap.LetSymbol]),
    action: (expr, evaluator, context) => {
      const letExpr = expr as NonTerminalExpr;
      const argCount = letExpr.children.length;

      const makeContext: (
        assignment: Expr,
        parent$: Observable<IContext>,
      ) => Observable<IContext> = (assignment, parent$) => {
        return parent$.pipe(
          map((parent) => {
            if (assignment.head === allSymbolsMap.AssignSymbol) {
              const assignExpr = assignment as NonTerminalExpr;
              const lhs = assignExpr.children[0];
              const rhs = assignExpr.children[1];
              const rhs$ = evaluator.evaluate(rhs, parent);
              const ctx = EvaluateHelper.makeEmptyContext();
              ctx.parent = parent;
              ctx.definitions.fixedAssign.push({
                pattern: lhs,
                action: (_, __, ___) => rhs$,
                displayName: ExprHelper.nodeToString(lhs) + ' -> ?',
                isStrong: true,
              });
              return ctx;
            } else if (assignment.head === allSymbolsMap.AssignDelayedSymbol) {
              const assignDelayedExpr = assignment as NonTerminalExpr;
              const lhs = assignDelayedExpr.children[0];
              const rhs = assignDelayedExpr.children[1];
              const ctx = EvaluateHelper.makeEmptyContext();
              ctx.parent = parent;
              ctx.definitions.delayedAssign.push({
                pattern: lhs,
                action: (_, _evaluator, _context) =>
                  _evaluator.evaluate(rhs, _context),
                displayName: ExprHelper.nodeToString(lhs) + ' -> ?',
              });
              return ctx;
            } else {
              return parent;
            }
          }),
        );
      };

      if (argCount === 0) {
        return of(expr);
      }

      const assignments: Expr[] = letExpr.children.slice(0, argCount - 1);

      if (assignments.length === 0) {
        return evaluator.evaluate(
          letExpr.children[letExpr.children.length - 1],
          context,
        );
      }

      const context$s: Observable<IContext>[] = [of(context)];
      for (let i = 0; i < assignments.length; i++) {
        const lastCtx = context$s[context$s.length - 1];
        const assignment = assignments[i];
        context$s.push(makeContext(assignment, lastCtx));
      }

      return context$s[context$s.length - 1].pipe(
        observeOn(asapScheduler),
        map((ctx) => {
          return evaluator.evaluate(letExpr.children[argCount - 1], ctx);
        }),
        concatAll(),
      );
    },
    displayName: 'Let[__] -> ?',
  },

  // Filter[_, _]
  {
    pattern: FilterExpr([BlankExpr([]), BlankExpr([])]),
    action: (expr, evaluator, context) => {
      const filterExpr = expr as NonTerminalExpr;
      const listLike = filterExpr.children[0];
      const pred = filterExpr.children[1];
      return evaluator.evaluate(listLike, context).pipe(
        map((listLike) => {
          if (
            listLike.nodeType === 'nonTerminal' &&
            listLike.head.nodeType === 'terminal' &&
            listLike.head.value === 'List'
          ) {
            if (listLike.children.length === 0) {
              return of(ListExpr([]));
            }

            const cond$s = listLike.children.map((ele) =>
              evaluator.evaluate(MakeNonTerminalExpr(pred, [ele]), context),
            );
            const conds$ = zip(cond$s);
            return conds$.pipe(
              map((conds) => {
                const listExprChildren: Expr[] = [];
                for (let i = 0; i < conds.length; i++) {
                  const cond = conds[i];
                  if (cond.nodeType === 'terminal' && cond.value === true) {
                    listExprChildren.push(listLike.children[i]);
                  }
                }

                return ListExpr(listExprChildren);
              }),
            );
          }

          return of(FilterExpr([listLike, pred]));
        }),
        concatAll(),
      );
    },
    displayName: 'Filter[_, _] -> ?',
  },

  // Float[_Number, _Number]
  {
    pattern: FloatExpr([
      BlankExpr([allSymbolsMap.NumberSymbol]),
      BlankExpr([allSymbolsMap.NumberSymbol]),
    ]),
    action: (expr, evaluator, ctx) => {
      const floatExpr = expr as NonTerminalExpr;
      const intgerPartExpr = floatExpr.children[0] as TerminalNumberExpr;
      const mantissaPartExpr = floatExpr.children[1] as TerminalNumberExpr;
      return of(
        NumberExpr(
          parseFloat(`${intgerPartExpr.value}.${mantissaPartExpr.value}`),
        ),
      );
    },
    displayName: 'Float[_Number, _Number] -> ?',
  },

  // Pi
  {
    pattern: allSymbolsMap.PiSymbol,
    action: (_, __, ___) => of(NumberExpr(Math.PI)),
    displayName: 'Pi -> ?',
  },

  // E
  {
    pattern: allSymbolsMap.ESymbol,
    action: (_, __, ___) => of(NumberExpr(Math.E)),
    displayName: 'E -> ?',
  },

  // Random[]
  {
    pattern: RandomExpr([]),
    action: (_, __, ___) => of(NumberExpr(Math.random())),
    displayName: 'Random[] -> ?',
  },

  // Not[True]
  {
    pattern: NotExpr([True]),
    action: (_, __, ___) => of(False),
    displayName: 'Not[True] -> False',
  },

  // Not[False]
  {
    pattern: NotExpr([False]),
    action: (_, __, ___) => of(True),
    displayName: 'Not[False] -> True',
  },
];
