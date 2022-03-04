/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transform } from 'stream';
import {
  builtInDefinitions,
  NodeFactory,
  NothingSymbol,
  Sequence,
} from './config';
import {
  Definition,
  Expr,
  IEvaluateContext,
  KeyValuePair,
  MatchResult,
  NoMatchResult,
  PatternMatchResult,
} from './interfaces';
import { allSymbols } from './config';

type ComparePair = { lhs: Expr[]; rhs: Expr[] };

export class Neo {
  public static patternMatch(
    lhs: Expr[],
    rhs: Expr[],
    lhsPtr: number,
    rhsPtr: number,
  ): PatternMatchResult {
    const lLength = lhs.length - lhsPtr;
    const rLength = rhs.length - rhsPtr;

    if (rLength === 0) {
      if (lLength === 0) {
        // l == 0 and r == 0
        return { pass: true, namedResult: {} };
      } else {
        // l != 0 and r == 0
        return { pass: false };
      }
    } else {
      // r != 0
      // 注意，到了这里即便是 l = 0 也不应立即退出。

      const pattern = rhs[0];
      if (pattern.nodeType === 'terminal') {
        if (lLength === 0) {
          return { pass: false };
        }

        // now we know that lhs has value
        const l = lhs[lhsPtr];
        const isEqual = ExprHelper.rawEqualQ([l], [rhs[rhsPtr]]);
        if (!isEqual) {
          return { pass: false };
        }

        const restMatch = Neo.patternMatch(lhs, rhs, lhsPtr + 1, rhsPtr + 1);
        if (!restMatch.pass) {
          return { pass: false };
        }

        restMatch.namedResult[rhsPtr.toString()] = [lhs[lhsPtr]];
        return { pass: true, namedResult: restMatch.namedResult };
      } else {
        if (
          pattern.children.length === 2 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'Pattern' &&
          pattern.children[0].nodeType === 'terminal' &&
          pattern.children[0].expressionType === 'symbol'
        ) {
          // as for Pattern[symbol, expr]

          const patternName = pattern.children[0].value;
          const patternAlias = rhsPtr.toString();
          const temp = rhs[rhsPtr];
          rhs[rhsPtr] = pattern.children[1];
          const reMatch = Neo.patternMatch(lhs, rhs, lhsPtr, rhsPtr);
          rhs[rhsPtr] = temp;
          if (!reMatch.pass) {
            return { pass: false };
          }

          if (reMatch.namedResult[patternName]) {
            const currentMatchVal = reMatch.namedResult[patternAlias];
            const anotherMatchVal = reMatch.namedResult[patternName];
            if (!ExprHelper.rawEqualQ(currentMatchVal, anotherMatchVal)) {
              return { pass: false };
            }
          }

          reMatch.namedResult[patternName] = reMatch.namedResult[patternAlias];
          return { pass: true, namedResult: reMatch.namedResult };
        } else if (
          pattern.children.length === 0 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'Blank'
        ) {
          // as for Blank[]

          if (lLength === 0) {
            return { pass: false };
          }

          const restMatch = Neo.patternMatch(lhs, rhs, lhsPtr + 1, rhsPtr + 1);
          if (!restMatch.pass) {
            return { pass: false };
          }

          const patternAlias = rhsPtr.toString();
          restMatch.namedResult[patternAlias] = [lhs[lhsPtr]];
          return { pass: true, namedResult: restMatch.namedResult };
        } else if (
          pattern.children.length === 1 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'Blank'
        ) {
          // as for Blank[expr]
          if (lLength === 0) {
            return { pass: false };
          }

          const tempLhsFirst = lhs[lhsPtr];
          const tempRhsFirst = rhs[rhsPtr];
          const expectedHead = pattern.children[0];
          lhs[lhsPtr] = lhs[lhsPtr].head;
          rhs[rhsPtr] = expectedHead;
          const headMatch = Neo.patternMatch(lhs, rhs, lhsPtr, rhsPtr);
          lhs[lhsPtr] = tempLhsFirst;
          rhs[rhsPtr] = tempRhsFirst;

          if (!headMatch.pass) {
            return { pass: false };
          }
          const patternAlias = rhsPtr.toString();
          headMatch.namedResult[patternAlias] = [tempLhsFirst];
          return { pass: true, namedResult: headMatch.namedResult };
        } else if (
          pattern.children.length === 0 &&
          pattern.head.nodeType == 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'BlankSequence'
        ) {
          // as for BlankSequence[]
          let lhsOffset = 1;
          let maxMatchLhsOffset: undefined | number = undefined;
          let matchedResult: Record<string, Expr[]> = {};
          while (lhsPtr + lhsOffset <= lhs.length) {
            const restMatch = Neo.patternMatch(
              lhs,
              rhs,
              lhsPtr + lhsOffset,
              rhsPtr + 1,
            );
            if (restMatch.pass) {
              matchedResult = restMatch.namedResult;
              maxMatchLhsOffset = lhsOffset;
            }
            lhsOffset = lhsOffset + 1;
          }

          if (!matchedResult) {
            return { pass: false };
          }

          if (maxMatchLhsOffset) {
            matchedResult[rhsPtr.toString()] = lhs.slice(
              lhsPtr,
              lhsPtr + maxMatchLhsOffset,
            );
          }

          return { pass: true, namedResult: matchedResult };
        } else if (
          pattern.children.length === 1 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'BlankSequence'
        ) {
          // as for BlankSequence[h]
          if (lLength === 0) {
            return { pass: false };
          }

          const expectH = pattern.children[0];
          const lhsTemp = lhs.slice(lhsPtr, lhs.length);
          const rhsTemp = rhs.slice(rhsPtr + 1, rhs.length);
          let tempLhsPtrOffset = 0;
          let matchResult: Record<string, Expr[]> = {};
          while (tempLhsPtrOffset < lhsTemp.length) {
            lhsTemp[tempLhsPtrOffset] = lhsTemp[tempLhsPtrOffset].head;
            rhsTemp.unshift(expectH);
            const match = Neo.patternMatch(lhsTemp, rhsTemp, 0, 0);
            if (!match.pass) {
              break;
            }
            matchResult = match.namedResult;
            tempLhsPtrOffset = tempLhsPtrOffset + 1;
          }
          if (tempLhsPtrOffset === 0) {
            return { pass: false };
          }

          matchResult[rhsPtr.toString()] = lhs.slice(
            lhsPtr,
            lhsPtr + tempLhsPtrOffset,
          );

          return { pass: true, namedResult: matchResult };
        } else {
          // 这时 pattern 是其他不认识的形式，而且 pattern 是 nonTerminal
          // 所以如果 lhs 第一个是 terminal, 则不匹配
          const l = lhs[lhsPtr];
          if (l.nodeType === 'terminal') {
            return { pass: false };
          }

          // 这时可以确定 lhs 第一个是 nonTerminal, 就可以分别比较头部和尾部了
          // 可以说是一种一般的处理方法
          const matchHead = Neo.patternMatch([l.head], [pattern.head], 0, 0);
          const matchChildren = Neo.patternMatch(
            [...l.children],
            [...pattern.children],
            0,
            0,
          );

          if (matchHead.pass && matchChildren.pass) {
            // 这里不用考虑命名 pattern 匹配值冲突问题，因为在处理 Pattern[symbol, x] 的情形的时候已经处理了
            const namedResult: Record<string, Expr[]> = {
              ...matchHead.namedResult,
              ...matchChildren.namedResult,
            };
            return { pass: true, namedResult };
          } else {
            return { pass: false };
          }
        }
      }
    }
  }
}

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
}

export class Evaluator extends Transform implements IEvaluateContext {
  /** 符号名称到符号对象的映射 */
  private _symbolNameMap: Record<string, Expr> = {};

  private _exprStack: Expr[] = [];

  /** 系统内建定义，这里的都是按照非标准求值程序进行 */
  private _builtInDefinitions: Definition[] = builtInDefinitions;

  /** 用户使用 Assign 指令下的全局定义 */
  private _userFixedDefinition: Definition[] = [];

  /** 用户使用 AssignDelayed 指令下的全局定义 */
  private _userDelayedDefinition: Definition[] = [];

  /**
   * 在进行模式匹配得到的定义，例如：
   *
   * 假设现在有这样一条定义存在：
   *
   * f[x_, y_] := x + y
   *
   * 这时我们尝试对表达式
   *
   * f[a, b]
   *
   * 求值，那么求值器会遍历所有定义，并且发现 f[a, b] 符合 f[x_, y_]，并且得到 x 的值为 a, y 的值为 b,
   * 那么这个「x 的值为 a, y 的值为 b」这条信息，则会临时记录在 _ephemeralDefinitions 变量中（入栈），
   *
   * 然后，求值器会对定义的右边进行求值，求值（递归的）的过程中，求值器还会尝试寻找 x 和 y 的定义，那么求值器就会在 _ephemeralDefinitions 中找到，
   *
   * 对定义的右边也就是 x + y 求值完成后，求值器会对 _ephemeralDefinitions 进行一次出栈操作，防止 _ephermeralDefinitions 的内容不断堆积导致内存泄露。
   */
  private _ephemeralDefinitions: Definition[][] = [];

  constructor() {
    super({ objectMode: true });
    this._exprStack = [];

    const symbolNameMap: Record<string, Expr> = {};
    for (const sbl of allSymbols) {
      if (sbl.nodeType === 'terminal' && sbl.expressionType === 'symbol') {
        symbolNameMap[sbl.value] = sbl;
      }
    }
    this._symbolNameMap = symbolNameMap;
  }

  public pushNode(n: Expr): void {
    this._exprStack.push(n);
  }

  public popNode(): Expr {
    return this._exprStack.pop() as Expr;
  }

  /** Modify node in-place */
  private stripSequenceSymbolFromExpr(node: Expr): void {
    if (node.nodeType === 'nonTerminal') {
      if (
        node.head.nodeType === 'nonTerminal' &&
        node.head.head.nodeType === 'terminal' &&
        node.head.head.expressionType === 'symbol' &&
        node.head.head.value == 'Sequence' &&
        node.head.children.length === 1
      ) {
        node.head = node.head.children[0];
      }

      const flattenChildren: Expr[] = [];
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (
          child.head.nodeType === 'terminal' &&
          child.nodeType === 'nonTerminal' &&
          child.head.expressionType === 'symbol' &&
          child.head.value === 'Sequence'
        ) {
          for (const subChild of child.children) {
            flattenChildren.push(subChild);
          }
        } else {
          flattenChildren.push(child);
        }
      }
      node.children = flattenChildren;

      this.stripSequenceSymbolFromExpr(node.head);
      for (let i = 0; i < node.children.length; i++) {
        this.stripSequenceSymbolFromExpr(node.children[i]);
      }
    }
  }

  /** 根据 expr 的 head 的符号（符号原型）的 nonStandard 字段决定是否采用非标准求值流程对 expr 进行求值 */
  public evaluate(expr: Expr): void {
    const head = expr.head;
    if (head.nodeType === 'terminal' && head.expressionType === 'symbol') {
      const symbolName = head.value;
      const headSymbol = this._symbolNameMap[symbolName] as typeof head;
      if (headSymbol.nonStandard) {
        this.nonStandardEvaluate(expr);
        return;
      }
    }

    this.standardEvaluate(expr);
  }

  private findDefinition(
    expr: Expr,
    definitions: Definition[],
  ): NoMatchResult | (MatchResult & { definition: Definition }) {
    for (const definition of definitions) {
      const match = Neo.patternMatch([expr], [definition.pattern], 0, 0);
      if (match.pass) {
        return { ...match, definition: definition };
      }
    }

    return { pass: false };
  }

  private standardEvaluate(expr: Expr): void {
    const head = expr.head;

    const definitions: Definition[] = [
      ...this._builtInDefinitions,
      ...this._userFixedDefinition,
      ...this._userDelayedDefinition,
    ];

    let applyCount = 0;

    const match = this.findDefinition(head, definitions);
    if (match.pass) {
      this.definitionApply(head, match.definition, match.namedResult);
      applyCount = applyCount + 1;
      expr.head = this.popNode();
    }

    if (expr.nodeType === 'nonTerminal') {
      for (let i = 0; i < expr.children.length; i++) {
        const match = this.findDefinition(expr.children[i], definitions);
        if (match.pass) {
          applyCount = applyCount + 1;
          this.definitionApply(
            expr.children[i],
            match.definition,
            match.namedResult,
          );
          expr.children[i] = this.popNode();
        }
      }
    }

    const matchForExpr = this.findDefinition(expr, definitions);
    let evaluatedExpr = expr;
    if (matchForExpr.pass) {
      applyCount = applyCount + 1;
      this.definitionApply(
        expr,
        matchForExpr.definition,
        matchForExpr.namedResult,
      );
      evaluatedExpr = this.popNode();
    }

    if (applyCount > 0) {
      this.evaluate(evaluatedExpr);
    } else {
      this.pushNode(evaluatedExpr);
    }
  }

  private nonStandardEvaluate(expr: Expr): void {
    for (const definition of this._builtInDefinitions) {
      const match = Neo.patternMatch([expr], [definition.pattern], 0, 0);
      if (match.pass) {
        this.definitionApply(expr, definition, match.namedResult);
        if (!definition.final) {
          this.evaluate(this.popNode());
        }
        return;
      }
    }
  }

  private findDefinitionAndReEvaluate(
    expr: Expr,
    definitions: Definition[],
  ): void {
    for (const def of definitions) {
      const match = Neo.patternMatch([expr], [def.pattern], 0, 0);
      if (match.pass) {
        this.definitionApply(expr, def, match.namedResult);
        const evaluated = this.popNode();
        if (!def.final) {
          this.evaluate(evaluated);
        }
        break;
      }
    }
  }

  private definitionApply(
    expr: Expr,
    definition: Definition,
    matchResult: Record<string, Expr[]>,
  ): void {
    const ephemeralDef: Definition[] = [];
    for (const key in matchResult) {
      const val = matchResult[key];
      ephemeralDef.push({
        pattern: NodeFactory.makeSymbol(key),
        action: (_, ctx) => {
          ctx.pushNode(Sequence(val));
        },
      });
    }
    this._ephemeralDefinitions.push(ephemeralDef);
    definition.action(expr, this);
    this._ephemeralDefinitions.pop();

    const evaluated = this.popNode();
    this.stripSequenceSymbolFromExpr(evaluated);
    this.pushNode(evaluated);
  }

  /**
   * 立即赋值，在赋值时就对右表达式进行求值，之后 pattern 将总是被替换为该结果
   *
   * 主要是由 Assign 函数调用, Evaluator 内部尽量不要依赖这个函数，换言之这是对外的
   */
  public assign(keyValuePair: KeyValuePair): void {
    const originValue = keyValuePair.value;
    this.evaluate(originValue);
    const value = this.popNode();
    this._userFixedDefinition.push({
      pattern: keyValuePair.pattern,
      action: (_, context) => {
        context.pushNode(value);
      },
    });

    this.pushNode(value);
  }

  /**
   * 清除赋值
   */
  public clearAssign(pattern: Expr): void {
    const beforeDefCounts = this._userFixedDefinition.length;
    this._userFixedDefinition = this._userFixedDefinition.filter((userDef) => {
      return !Neo.patternMatch([userDef.pattern], [pattern], 0, 0).pass;
    });
    const afterDefCounts = this._userFixedDefinition.length;
    this.pushNode({
      nodeType: 'terminal',
      expressionType: 'number',
      head: NodeFactory.makeSymbol('Integer'),
      value: afterDefCounts - beforeDefCounts,
    });
  }

  /**
   * 清除延迟赋值
   *
   * 提示：
   *
   * In[]:= MatchQ[Pattern[x, Blank[]], Verbatim[Pattern[x, Blank[]]]]
   *
   * Out[]= True
   *
   * 所以假如之前做了这样一个延迟赋值操作：
   *
   * AssignDelayed[
   *   Pattern[x, Blank[]],
   *   f[x]
   * ]
   *
   * 则我们可以通过命令
   *
   * ClearDelayedAssign[Verbatim[Pattern[x, Blank[]]]]
   *
   * 来清除它。
   */
  public clearDelayedAssign(pattern: Expr): void {
    const beforeCounts = this._userDelayedDefinition.length;
    this._userDelayedDefinition = this._userDelayedDefinition.filter((def) => {
      return !Neo.patternMatch([def.pattern], [pattern], 0, 0).pass;
    });
    const afterCounts = this._userDelayedDefinition.length;

    this.pushNode({
      nodeType: 'terminal',
      expressionType: 'number',
      head: NodeFactory.makeSymbol('Integer'),
      value: afterCounts - beforeCounts,
    });
  }

  /**
   * 延迟赋值，每次读取时将重新求值
   *
   * 主要是由 AssignDelayed 函数调用, Evaluator 内部尽量不要依赖这个函数，换言之这是对外的
   */
  public assignDelayed(keyValuePair: KeyValuePair): void {
    const originValue = keyValuePair.value;
    this._userDelayedDefinition.push({
      pattern: keyValuePair.pattern,
      action: (_, context) => {
        context.evaluate(originValue);
      },
    });

    this.pushNode(NothingSymbol);
  }
}
