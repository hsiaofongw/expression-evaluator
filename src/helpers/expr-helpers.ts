import { Sequence } from 'src/translate/config';
import { Expr, PatternMatchResult } from 'src/translate/interfaces';

type ComparePair = { lhs: Expr[]; rhs: Expr[] };

export class Neo {
  public static patternMatch(lhs: Expr[], rhs: Expr[]): PatternMatchResult {
    const match = Neo.patternMatchRecursive(lhs, rhs, 0, 0);
    if (match.pass) {
      const result: Record<string, Expr[]> = {};
      for (const key in match.namedResult) {
        if (key.length > 0 && key[0].match(/[a-zA-Z_]/)) {
          result[key] = match.namedResult[key];
        }
      }
      match.namedResult = result;
      return match;
    } else {
      return { pass: false };
    }
  }

  public static patternMatchRecursive(
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

      const pattern = rhs[rhsPtr];
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

        const restMatch = Neo.patternMatchRecursive(
          lhs,
          rhs,
          lhsPtr + 1,
          rhsPtr + 1,
        );
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
          const reMatch = Neo.patternMatchRecursive(lhs, rhs, lhsPtr, rhsPtr);
          rhs[rhsPtr] = temp;
          if (!reMatch.pass) {
            return { pass: false };
          }

          const currentMatchExprs = reMatch.namedResult[patternAlias];
          const currentMatchLength = currentMatchExprs.length;
          const newLhsPtr = lhsPtr + currentMatchLength;
          const newRhsPtr = rhsPtr + 1;
          const restMatch = Neo.patternMatchRecursive(
            lhs,
            rhs,
            newLhsPtr,
            newRhsPtr,
          );

          if (!restMatch.pass) {
            return { pass: false };
          }

          if (restMatch.namedResult[patternName]) {
            const currentMatchVal = currentMatchExprs;
            const anotherMatchVal = restMatch.namedResult[patternName];
            if (!ExprHelper.rawEqualQ(currentMatchVal, anotherMatchVal)) {
              return { pass: false };
            }
          }

          restMatch.namedResult[patternName] = currentMatchExprs;
          return { pass: true, namedResult: restMatch.namedResult };
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

          const restMatch = Neo.patternMatchRecursive(
            lhs,
            rhs,
            lhsPtr + 1,
            rhsPtr + 1,
          );
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
          const headMatch = Neo.patternMatchRecursive(lhs, rhs, lhsPtr, rhsPtr);
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
            const restMatch = Neo.patternMatchRecursive(
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
            const match = Neo.patternMatchRecursive(lhsTemp, rhsTemp, 0, 0);
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
        } else if (
          pattern.children.length === 0 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'BlankNullSequence'
        ) {
          // as for BlankNullSequence[]
          let lhsOffset = 0;
          let matchResult: Record<string, Expr[]> | undefined = undefined;
          while (lhsPtr + lhsOffset < lhs.length) {
            const matchRest = Neo.patternMatchRecursive(
              lhs,
              rhs,
              lhsPtr + lhsOffset,
              rhsPtr + 1,
            );
            if (matchRest.pass) {
              matchResult = matchRest.namedResult;
              matchResult[rhsPtr.toString()] = lhs.slice(
                lhsPtr,
                lhsPtr + lhsOffset,
              );
            }

            lhsOffset = lhsOffset + 1;
          }

          if (matchResult === undefined) {
            return { pass: false };
          } else {
            return { pass: true, namedResult: matchResult };
          }
        } else if (
          pattern.children.length === 1 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'Verbatim'
        ) {
          // as for Verbatim[x]
          if (lLength === 0) {
            return { pass: false };
          }

          const l = lhs[lhsPtr];
          const isEqual = ExprHelper.rawEqualQ([l], [pattern.children[0]]);
          if (!isEqual) {
            return { pass: false };
          }

          const restMatch = Neo.patternMatchRecursive(
            lhs,
            rhs,
            lhsPtr + 1,
            rhsPtr + 1,
          );
          if (!restMatch.pass) {
            return { pass: false };
          }

          restMatch.namedResult[rhsPtr.toString()] = [l];
          return { pass: true, namedResult: restMatch.namedResult };
        } else if (
          pattern.children.length === 0 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'NumberExpressionType'
        ) {
          // as for NumberExpressionType[]
          // 匹配所有 expressionType 为 Number 的 Expr
          if (lLength === 0) {
            return { pass: false };
          }

          const l = lhs[lhsPtr];
          if (l.nodeType === 'nonTerminal') {
            return { pass: false };
          }

          if (l.expressionType !== 'number') {
            return { pass: false };
          }

          const restMatch = Neo.patternMatchRecursive(
            lhs,
            rhs,
            lhsPtr + 1,
            rhsPtr + 1,
          );
          if (!restMatch.pass) {
            return { pass: false };
          }

          restMatch.namedResult[rhsPtr.toString()] = [l];
          return { pass: true, namedResult: restMatch.namedResult };
        } else {
          // 这时 pattern 是其他不认识的形式，而且 pattern 是 nonTerminal
          // 所以如果 lhs 第一个是 terminal, 则不匹配
          const l = lhs[lhsPtr];
          if (l.nodeType === 'terminal') {
            return { pass: false };
          }

          // 这时可以确定 lhs 第一个是 nonTerminal, 就可以分别比较头部和尾部了
          // 可以说是一种一般的处理方法
          const matchHead = Neo.patternMatchRecursive(
            [l.head],
            [pattern.head],
            0,
            0,
          );
          const matchChildren = Neo.patternMatchRecursive(
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

  /** 序列化 */
  public static nodeToString(node: Expr): string {
    if (node.nodeType === 'terminal') {
      return node.value.toString();
    } else {
      const childrenDisplay = node.children
        .map((_n) => ExprHelper.nodeToString(_n))
        .join(', ');
      return `${ExprHelper.nodeToString(node.head)}[${childrenDisplay}]`;
    }
  }

  /** 浅复制 */
  public static shallowCopy(node: Expr): Expr {
    const newNode: Expr = { ...node } as any;
    if (newNode.nodeType === 'nonTerminal') {
      newNode.children = newNode.children.slice();
    }
    return newNode;
  }

  /** 序列号 NamedResult */
  public static namedResultToString(
    namedResult: Record<string, Expr[]>,
  ): string {
    const pairs: { key: string; value: Expr[] }[] = [];
    for (const key in namedResult) {
      pairs.push({ key, value: namedResult[key] });
    }

    return pairs
      .map(
        (pair) =>
          `${pair.key} -> ${ExprHelper.nodeToString(Sequence(pair.value))}`,
      )
      .join('\n');
  }

  /** 替换关系序列化 */
  public static keyValuePairToString(key: Expr, value: Expr): string {
    // eslint-disable-next-line prettier/prettier
    return `${ExprHelper.nodeToString(key)} -> ${ExprHelper.nodeToString(value)}`;
  }
}
