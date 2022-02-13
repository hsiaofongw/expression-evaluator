/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transform } from 'stream';
import {
  builtInDefinitions,
  List,
  NodeFactory,
  patternActions,
} from './config';
import {
  Definition,
  Expr,
  IEvaluateContext,
  KeyValuePair,
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
  private _builtInDefinitions: Definition[] = builtInDefinitions;
  private _userDefinitionStack: Definition[][] = [];

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

  /**
   * （后续这块得好好优化，一定有更好的方法）
   *
   * 给定一个表达式 expr, 寻找它的重写规则，先在用户定义规则栈里边找，再在系统内置符号栈里边找
   *
   * 如果找不到，返回 undefined
   */
  private _findDefinition(expr: Expr):
    | {
        definition: Definition;
        patternMatchResult: SuccessfulSequenceMatchResult;
      }
    | undefined {
    // 从栈顶找到栈底
    for (let i = 0; i < this._userDefinitionStack.length; i++) {
      const defStack =
        this._userDefinitionStack[this._userDefinitionStack.length - 1 - i];

      // 从左到右
      for (let j = 0; j < defStack.length; j++) {
        const definition = defStack[j];
        const matchResult = ExprHelper.patternMatch(
          expr,
          definition.pattern,
          this,
        );
        if (matchResult.pass) {
          return { definition, patternMatchResult: matchResult };
        }
      }
    }

    // 系统内置符号顺序关系不大，直接线性搜索
    for (let i = 0; i < this._builtInDefinitions.length; i++) {
      const definition = this._builtInDefinitions[i];
      const matchResult = ExprHelper.patternMatch(
        expr,
        definition.pattern,
        this,
      );
      if (matchResult.pass) {
        return { definition, patternMatchResult: matchResult };
      }
    }

    return undefined;
  }

  /** 对表达式进行求值，如果有规则，按规则来，如果没有，原样返回（到栈顶） */
  public evaluate(expr: Expr): void {
    const definitionAndMatchResult = this._findDefinition(expr);
    if (!definitionAndMatchResult) {
      this.pushNode(expr);
      return;
    }

    const definition = definitionAndMatchResult.definition;
    const matchResult = definitionAndMatchResult.patternMatchResult.result;
    const keyValuePairs: KeyValuePair[] = [];
    for (const symbolName in matchResult) {
      keyValuePairs.push({
        pattern: NodeFactory.makeSymbol(symbolName),
        value: List(matchResult[symbolName]),
      });
    }
    // 传入实参
    this._assignImmediately(keyValuePairs);

    // 求值
    definition.action(expr, this);
    const value = this.popNode() as Expr;

    // 恢复现场
    this._undoLastAssign();

    // 输出结果
    this.push(value);
  }

  /** 弹出用户定义栈，相当于撤销最近一次赋值操作 */
  private _undoLastAssign(): void {
    this._userDefinitionStack.pop();
  }

  /** 立即赋值，且不对右值进行求值 */
  private _assignImmediately(keyValuePairs: KeyValuePair[]): void {
    const defStack: Definition[] = [];
    for (const pair of keyValuePairs) {
      const { pattern, value } = pair;
      defStack.push({
        pattern: pattern,
        action: (_, context) => {
          context.pushNode(value);
        },
      });
    }
    this._userDefinitionStack.push(defStack);
  }

  /** 立即赋值，在赋值时就对右表达式进行求值，之后 pattern 将总是被替换为该结果 */
  public assign(keyValuePairs: KeyValuePair[]): void {
    const defStack: Definition[] = [];
    for (const pair of keyValuePairs) {
      const { pattern, value } = pair;
      this.evaluate(value);
      const evaluated = this.popNode() as Expr;
      defStack.push({
        pattern: pattern,
        action: (_, context) => {
          // 结果值以闭包的形式保存下来了
          context.pushNode(evaluated);
        },
      });
    }
    this._userDefinitionStack.push(defStack);
  }

  /** 延迟赋值，每次读取时将重新求值 */
  public assignDelayed(keyValuePairs: KeyValuePair[]): void {
    const defStack: Definition[] = [];
    for (const pair of keyValuePairs) {
      const { pattern, value } = pair;
      defStack.push({
        pattern: pattern,
        action: (_, context) => {
          // 原值以闭包的形式保存下来了
          this.evaluate(value);
          const evaluated = this.popNode() as Expr;
          context.pushNode(evaluated);
        },
      });
    }
    this._userDefinitionStack.push(defStack);
  }
}
