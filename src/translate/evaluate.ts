/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transform } from 'stream';
import { patternActions } from './config';
import {
  Definition,
  Expr,
  IEvaluateContext,
  SequenceMatchResult,
  SuccessfulSequenceMatchResult,
} from './interfaces';

type ComparePair = { lhs: Expr[]; rhs: Expr[] };

export class ExprHelper {
  /** 返回两个 terminal 节点是否相等 */
  public static isTerminalEqual(expr1: Expr, expr2: Expr): boolean {
    if (expr1.nodeType === 'terminal' && expr2.nodeType === 'terminal') {
      if (ExprHelper.l0Compare(expr1.head, expr2.head)) {
        if (expr1.expressionType === expr2.expressionType) {
          if (expr1.value === expr2.value) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /** 返回 true 仅当 expr 是一个 Symbol */
  public static isSymbol(expr: Expr): boolean {
    return expr.head === expr.head.head;
  }

  /** 返回 true 仅当 expr1 和 expr2 都是 Symbol, 并且 Symbol 名称相等 */
  public static l0Compare(expr1: Expr, expr2: Expr): boolean {
    return (
      expr1.nodeType === 'terminal' &&
      expr2.nodeType === 'terminal' &&
      expr1.expressionType === 'symbol' &&
      expr2.expressionType === 'symbol' &&
      expr1.value === expr2.value
    );
  }

  /** 返回 true 仅当 expr1.head 和 expr2.head 满足 l0Compare, 并且 expr1 和 expr2 都是只有 0 个 children. */
  public static l1Compare(expr1: Expr, expr2: Expr): boolean {
    return (
      ExprHelper.l0Compare(expr1.head, expr2.head) &&
      expr1.nodeType === 'nonTerminal' &&
      expr2.nodeType === 'nonTerminal' &&
      expr1.children.length === 0 &&
      expr2.children.length === 0
    );
  }

  /** 直接全等判定：不求值，直接对比两个表达式的各个部分 */
  public static rawEqualQ(seq1: Expr[], seq2: Expr[]): boolean {
    const pairs: ComparePair[] = [{ lhs: seq1.slice(), rhs: seq2.slice() }];
    while (pairs.length > 0) {
      const { lhs, rhs } = pairs.pop() as ComparePair;
      while (lhs.length > 0 && rhs.length > 0) {
        const p = lhs.shift();
        const q = rhs.shift();

        if (p.nodeType === 'terminal' && q.nodeType === 'terminal') {
          const isEqual = ExprHelper.isTerminalEqual(p, q);
          if (!isEqual) {
            return false;
          }
        } else if (
          p.nodeType === 'nonTerminal' &&
          q.nodeType === 'nonTerminal'
        ) {
          pairs.push({ lhs: [...p.children], rhs: [...q.children] });
          pairs.push({ lhs: [p.head], rhs: [q.head] });
        } else {
          return false;
        }
      }

      if (lhs.length !== 0 || rhs.length !== 0) {
        return false;
      }
    }

    return true;
  }

  public static patternMatch(
    expr: Expr,
    pattern: Expr,
    context: IEvaluateContext,
  ): SequenceMatchResult {
    const comparePairs: ComparePair[] = [{ lhs: [expr], rhs: [pattern] }];
    const namedResult: SuccessfulSequenceMatchResult['result'] = {};

    while (comparePairs.length) {
      const pair = comparePairs.pop() as ComparePair;

      while (pair.lhs.length > 0 && pair.rhs.length > 0) {
        const expr = pair.lhs.shift() as Expr;
        const pattern = pair.rhs.shift() as Expr;

        if (pattern.nodeType === 'terminal') {
          const isSymbolEqual = ExprHelper.isTerminalEqual(expr, pattern);
          if (isSymbolEqual) {
            continue;
          } else {
            return { pass: false };
          }
        } else {
          const patternAction = patternActions.find((pa) =>
            pa.forPattern(pattern),
          );
          if (patternAction) {
            pair.lhs.unshift(expr);
            const matchResult = patternAction.action(
              pair.lhs,
              pattern,
              context,
            );
            if (matchResult.pass === false) {
              return { pass: false };
            }

            if (matchResult.name && namedResult[matchResult.name]) {
              if (
                !ExprHelper.rawEqualQ(
                  matchResult.exprs,
                  namedResult[matchResult.name],
                )
              ) {
                return { pass: false };
              }
            }

            if (matchResult.name) {
              namedResult[matchResult.name] = matchResult.exprs;
            }
          } else {
            const exprHeadSeq: Expr[] = [expr.head];
            const subPatternHeadSeq: Expr[] = [pattern.head];

            if (expr.nodeType === 'terminal') {
              return { pass: false };
            } else {
              const exprBodySeq: Expr[] = [...expr.children];
              const subPatternBodySeq: Expr[] = [...pattern.children];

              // 先分别比较 head, 再分别比较 body, 入栈的顺序反过来
              // 先比较 head 能更快收敛
              comparePairs.push({ lhs: exprBodySeq, rhs: subPatternBodySeq });
              comparePairs.push({ lhs: exprHeadSeq, rhs: subPatternHeadSeq });
            }
          }
        }
      }

      if (pair.lhs.length !== 0 || pair.rhs.length !== 0) {
        return { pass: false };
      }
    }

    return { pass: true, result: namedResult };
  }
}

export class Evaluator extends Transform implements IEvaluateContext {
  private _exprStack: Expr[] = [];
  private _definitions: Definition[] = [];

  constructor() {
    super({ objectMode: true });
    this._exprStack = [];
  }

  public pushNode(n: Expr): void {
    this._exprStack.push(n);
  }

  public popNode(): Expr {
    return this._exprStack.pop() as Expr;
  }

  public matchQ(node: Expr, pattern: Expr): boolean {
    const patterns: Expr[] = [pattern];
    const exprs: Expr[] = [node];

    while (patterns.length > 0) {
      const pattern = patterns.pop() as Expr;
    }

    return true;
  }

  public evaluate(node: Expr): void {}
}
