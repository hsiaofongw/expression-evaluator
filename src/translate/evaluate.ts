/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transform } from 'stream';
import { patternActions } from './config';
import { Definition, ExpressionNode, IEvaluateContext } from './interfaces';

type ComparePair = { lhs: ExpressionNode[]; rhs: ExpressionNode[] };

class ExprHelper {
  /** 返回两个 terminal 节点是否相等 */
  public static isTerminalEqual(
    expr1: ExpressionNode,
    expr2: ExpressionNode,
  ): boolean {
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
  public static isSymbol(expr: ExpressionNode): boolean {
    return expr.head === expr.head.head;
  }

  /** 返回 true 仅当 expr1 和 expr2 都是 Symbol, 并且 Symbol 名称相等 */
  public static l0Compare(
    expr1: ExpressionNode,
    expr2: ExpressionNode,
  ): boolean {
    return (
      expr1.nodeType === 'terminal' &&
      expr2.nodeType === 'terminal' &&
      expr1.expressionType === 'symbol' &&
      expr2.expressionType === 'symbol' &&
      expr1.value === expr2.value
    );
  }

  /** 返回 true 仅当 expr1.head 和 expr2.head 满足 l0Compare, 并且 expr1 和 expr2 都是只有 0 个 children. */
  public static l1Compare(
    expr1: ExpressionNode,
    expr2: ExpressionNode,
  ): boolean {
    return (
      ExprHelper.l0Compare(expr1.head, expr2.head) &&
      expr1.nodeType === 'nonTerminal' &&
      expr2.nodeType === 'nonTerminal' &&
      expr1.children.length === 0 &&
      expr2.children.length === 0
    );
  }

  public static sequenceMatch(
    sequence: ExpressionNode[],
    patterns: ExpressionNode[],
  ): boolean {
    const comparePairs: ComparePair[] = [{ lhs: sequence, rhs: patterns }];

    while (comparePairs.length) {
      const comparePair = comparePairs.pop() as ComparePair;
      const sequence = comparePair.lhs;
      const patterns = comparePair.rhs;

      while (sequence.length > 0 && patterns.length > 0) {
        const expr = sequence.shift() as ExpressionNode;
        const pattern = patterns.shift() as ExpressionNode;

        if (pattern.nodeType === 'terminal') {
          return ExprHelper.isTerminalEqual(expr, pattern);
        } else {
          const patternAction = patternActions.find((pa) =>
            ExprHelper.l1Compare(pattern, pa.forPattern),
          );
          if (patternAction) {
            sequence.unshift(expr);
            const result = patternAction.action(sequence);
            if (result.pass === false) {
              return false;
            } else {
              continue;
            }
          } else {
            const exprHeadSeq: ExpressionNode[] = [expr.head];
            const subPatternHeadSeq: ExpressionNode[] = [pattern.head];

            if (expr.nodeType === 'terminal') {
              return false;
            } else {
              const exprBodySeq: ExpressionNode[] = [...expr.children];
              const subPatternBodySeq: ExpressionNode[] = [...pattern.children];

              // 先分别比较 head, 再分别比较 body, 入栈的顺序反过来
              // 先比较 head 能更快收敛
              comparePairs.push({ lhs: exprBodySeq, rhs: subPatternBodySeq });
              comparePairs.push({ lhs: exprHeadSeq, rhs: subPatternHeadSeq });
            }
          }
        }
      }

      if (sequence.length !== 0 || patterns.length !== 0) {
        return false;
      }
    }

    return true;
  }
}

export class Evaluator extends Transform implements IEvaluateContext {
  private _exprStack: ExpressionNode[] = [];
  private _definitions: Definition[] = [];

  constructor() {
    super({ objectMode: true });
    this._exprStack = [];
  }

  public pushNode(n: ExpressionNode): void {
    this._exprStack.push(n);
  }

  public popNode(): ExpressionNode {
    return this._exprStack.pop() as ExpressionNode;
  }

  public matchQ(node: ExpressionNode, pattern: ExpressionNode): boolean {
    const patterns: ExpressionNode[] = [pattern];
    const exprs: ExpressionNode[] = [node];

    while (patterns.length > 0) {
      const pattern = patterns.pop() as ExpressionNode;
    }

    return true;
  }

  public evaluate(node: ExpressionNode): void {}
}
