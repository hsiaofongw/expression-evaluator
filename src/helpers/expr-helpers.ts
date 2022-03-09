import { SequenceExpr } from 'src/translate/config';
import { Expr, PatternMatchResult } from 'src/translate/interfaces';

type ComparePair = { lhs: Expr[]; rhs: Expr[] };

export class Neo {
  public static patternMatch(lhs: Expr[], rhs: Expr[]): PatternMatchResult {
    const match = Neo.patternMatchRecursive(lhs, rhs);
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
  ): PatternMatchResult {
    // console.log(`Lhs: ${lhs.map(expr => ExprHelper.nodeToString(expr)).join(', ')}`);
    // console.log(`Rhs: ${rhs.map(expr => ExprHelper.nodeToString(expr)).join(', ')}`);

    if (lhs.length !== 0 && rhs.length === 0) {
      return { pass: false };
    } else if (lhs.length === rhs.length && rhs.length === 0) {
      return { pass: true, namedResult: {} };
    } else {
      const pattern = rhs[0];
      if (pattern.nodeType === 'terminal') {
        if (lhs.length === 0) {
          return { pass: false };
        }

        // now we know that lhs has value
        const l = lhs[0];
        const isEqual = ExprHelper.rawEqualQ([l], [rhs[0]]);
        if (!isEqual) {
          return { pass: false };
        }

        const restMatch = Neo.patternMatchRecursive(
          lhs.slice(1, lhs.length),
          rhs.slice(1, rhs.length),
        );
        if (!restMatch.pass) {
          return { pass: false };
        }

        restMatch.namedResult['0'] = [lhs[0]];
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
          const temp = rhs[0];
          rhs[0] = pattern.children[1];
          const reMatch = Neo.patternMatchRecursive(lhs, rhs);
          rhs[0] = temp;
          if (!reMatch.pass) {
            return { pass: false };
          }

          if (reMatch.namedResult[patternName]) {
            if (
              !ExprHelper.rawEqualQ(
                reMatch.namedResult[patternName],
                lhs.slice(0, reMatch.namedResult['0'].length),
              )
            ) {
              return { pass: false };
            }
          }

          reMatch.namedResult[patternName] = reMatch.namedResult['0'];
          return { pass: true, namedResult: reMatch.namedResult };
        } else if (
          pattern.children.length === 0 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'Blank'
        ) {
          // as for Blank[]

          if (lhs.length === 0) {
            return { pass: false };
          }

          const restMatch = Neo.patternMatchRecursive(
            lhs.slice(1, lhs.length),
            rhs.slice(1, rhs.length),
          );
          if (!restMatch.pass) {
            return { pass: false };
          }

          restMatch.namedResult['0'] = [lhs[0]];
          return { pass: true, namedResult: restMatch.namedResult };
        } else if (
          pattern.children.length === 1 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'Blank'
        ) {
          // as for Blank[expr]
          if (lhs.length === 0) {
            return { pass: false };
          }

          const originLhsHead = lhs[0];
          lhs[0] = lhs[0].head;
          rhs[0] = pattern.children[0];
          const reMatch = Neo.patternMatchRecursive(lhs, rhs);
          lhs[0] = originLhsHead;
          rhs[0] = pattern;
          if (!reMatch.pass) {
            return { pass: false };
          }

          reMatch.namedResult['0'] = [originLhsHead];
          return { pass: true, namedResult: reMatch.namedResult };
        } else if (
          pattern.children.length === 0 &&
          pattern.head.nodeType == 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'BlankSequence'
        ) {
          // as for BlankSequence[]
          if (lhs.length === 0) {
            return { pass: false };
          }

          let namedResult: Record<string, Expr[]> | undefined;
          const restRhs = rhs.slice(1, rhs.length);
          for (let k = 1; k <= lhs.length; k++) {
            const restLhs = lhs.slice(k, lhs.length);
            const restMatch = Neo.patternMatchRecursive(restLhs, restRhs);
            if (restMatch.pass) {
              namedResult = restMatch.namedResult;
              namedResult['0'] = lhs.slice(0, k);
            }
          }

          if (!namedResult) {
            return { pass: false };
          }

          return { pass: true, namedResult };
        } else if (
          pattern.children.length === 1 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'BlankSequence'
        ) {
          // as for BlankSequence[h]
          if (lhs.length === 0) {
            return { pass: false };
          }

          const expectH = pattern.children[0];
          const lhs1 = lhs.slice(0, 1);
          const rhs1 = rhs.slice(0, 1);
          lhs1[0] = lhs1[0].head;
          rhs1[0] = expectH;

          let namedResult: Record<string, Expr[]> | undefined;

          const lhs2 = lhs.slice(1, lhs.length);
          const rhs2 = rhs.slice(1, rhs.length);
          for (let k = 1; k <= lhs.length; k++) {
            const matchCurrent = Neo.patternMatchRecursive(lhs1, rhs1);
            if (!matchCurrent.pass) {
              break;
            }

            const matchRest = Neo.patternMatchRecursive(lhs2, rhs2);
            if (!matchRest.pass) {
              break;
            }

            if (
              ExprHelper.nameConflictQ(
                matchCurrent.namedResult,
                matchRest.namedResult,
              )
            ) {
              break;
            }

            namedResult = ExprHelper.mergeNamedResult(
              matchCurrent.namedResult,
              matchRest.namedResult,
            );
            namedResult['0'] = lhs.slice(0, lhs1.length);
            if (lhs2.length > 0) {
              const exprBeingLhs = lhs2.shift() as Expr;
              lhs1.push(exprBeingLhs.head);
              rhs1.push(expectH);
            }
          }

          if (!namedResult) {
            return { pass: false };
          }

          return { pass: true, namedResult: namedResult };
        } else if (
          pattern.children.length === 0 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'BlankNullSequence'
        ) {
          // as for BlankNullSequence[]
          let namedResult: Record<string, Expr[]> | undefined;
          const restRhs = rhs.slice(1, rhs.length);
          for (let k = 0; k <= lhs.length; k++) {
            const matchRest = Neo.patternMatchRecursive(
              lhs.slice(k, lhs.length),
              restRhs,
            );
            if (matchRest.pass) {
              namedResult = matchRest.namedResult;
              namedResult['0'] = lhs.slice(0, k);
            }
          }

          if (namedResult === undefined) {
            return { pass: false };
          } else {
            return { pass: true, namedResult };
          }
        } else if (
          pattern.children.length === 1 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'BlankNullSequence'
        ) {
          // as for BlankNullSequence[h]
          const expectHead = pattern.children[0];
          let namedResult: undefined | Record<string, Expr[]>;
          const lhsTemp: Expr[] = [];
          const rhsTemp: Expr[] = [];
          const rhsRest = rhs.slice(1, rhs.length);
          for (let k = 0; k <= lhs.length; k++) {
            const currentMatch = Neo.patternMatchRecursive(lhsTemp, rhsTemp);
            const restMatch = Neo.patternMatchRecursive(
              lhs.slice(lhsTemp.length, lhs.length),
              rhsRest,
            );
            if (
              currentMatch.pass &&
              restMatch.pass &&
              !ExprHelper.nameConflictQ(
                currentMatch.namedResult,
                restMatch.namedResult,
              )
            ) {
              namedResult = ExprHelper.mergeNamedResult(
                currentMatch.namedResult,
                restMatch.namedResult,
              );
              namedResult['0'] = lhs.slice(0, lhsTemp.length);
            }

            if (lhs.length - lhsTemp.length > 0) {
              const exprBeingLhs = lhs.shift() as Expr;
              lhsTemp.push(exprBeingLhs.head);
              rhsTemp.push(expectHead);
            }
          }

          if (namedResult === undefined) {
            return { pass: false };
          }

          return { pass: true, namedResult: namedResult };
        } else if (
          pattern.children.length === 1 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'Verbatim'
        ) {
          // as for Verbatim[x]
          if (lhs.length === 0) {
            return { pass: false };
          }

          const isEqual = ExprHelper.rawEqualQ([lhs[0]], [pattern.children[0]]);
          if (!isEqual) {
            return { pass: false };
          }

          const restMatch = Neo.patternMatchRecursive(
            lhs.slice(1, lhs.length),
            rhs.slice(1, rhs.length),
          );
          if (!restMatch.pass) {
            return { pass: false };
          }

          restMatch.namedResult['0'] = [lhs[0]];
          return { pass: true, namedResult: restMatch.namedResult };
        } else if (
          pattern.children.length === 0 &&
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.head.value === 'NumberExpressionType'
        ) {
          // as for NumberExpressionType[]
          // 匹配所有 expressionType 为 Number 的 Expr
          if (lhs.length === 0) {
            return { pass: false };
          }

          if (lhs[0].nodeType === 'nonTerminal') {
            return { pass: false };
          }

          if (lhs[0].expressionType !== 'number') {
            return { pass: false };
          }

          const restMatch = Neo.patternMatchRecursive(
            lhs.slice(1, lhs.length),
            rhs.slice(1, rhs.length),
          );
          if (!restMatch.pass) {
            return { pass: false };
          }

          restMatch.namedResult['0'] = [lhs[0]];
          return { pass: true, namedResult: restMatch.namedResult };
        } else if (
          pattern.head.nodeType === 'terminal' &&
          pattern.head.expressionType === 'symbol' &&
          pattern.children.length >= 1 &&
          pattern.head.value === 'Alternatives'
        ) {
          // as For Alternatives[x,y,z,...]
          for (const alternative of pattern.children) {
            rhs[0] = alternative;
            const match = Neo.patternMatchRecursive(lhs, rhs);
            if (match.pass) {
              rhs[0] = pattern;
              return { pass: true, namedResult: match.namedResult };
            }
            rhs[0] = pattern;
          }
          return { pass: false };
        } else {
          // 这时 pattern 是其他不认识的形式，而且 pattern 是 nonTerminal
          // 所以如果 lhs 第一个是 terminal, 则不匹配
          if (lhs[0].nodeType === 'terminal') {
            return { pass: false };
          }

          // 这时可以确定 lhs 第一个是 nonTerminal, 就可以分别比较头部和尾部了
          // 可以说是一种一般的处理方法
          const matchHead = Neo.patternMatchRecursive(
            [lhs[0].head],
            [pattern.head],
          );
          const matchChildren = Neo.patternMatchRecursive(
            [...lhs[0].children],
            [...pattern.children],
          );

          if (matchHead.pass && matchChildren.pass) {
            // 这里不用考虑命名 pattern 匹配值冲突问题，因为在处理 Pattern[symbol, x] 的情形的时候已经处理了
            return {
              pass: true,
              namedResult: ExprHelper.mergeNamedResult(
                matchHead.namedResult,
                matchChildren.namedResult,
              ),
            };
          } else {
            return { pass: false };
          }
        }
      }
    }
  }
}

export class ExprHelper {
  public static nameConflictQ(
    a: Record<string, Expr[]>,
    b: Record<string, Expr[]>,
  ): boolean {
    for (const k in a) {
      if (
        typeof k === 'string' &&
        k.length > 0 &&
        k[0].match(/[a-zA-Z]/) &&
        b[k]
      ) {
        return true;
      }
    }

    return false;
  }

  public static mergeNamedResult(
    a: Record<string, Expr[]>,
    b: Record<string, Expr[]>,
  ): Record<string, Expr[]> {
    const merged: Record<string, Expr[]> = {};

    for (const k in a) {
      merged[k] = a[k];
    }

    for (const k in b) {
      merged[k] = b[k];
    }

    return merged;
  }

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
      if (node.expressionType === 'boolean') {
        if (node.value === true) {
          return 'True::boolean';
        } else {
          return 'False::boolean';
        }
      }
      return node.value.toString() + '::' + node.expressionType;
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
          `${pair.key} -> ${ExprHelper.nodeToString(SequenceExpr(pair.value))}`,
      )
      .join('\n');
  }

  /** 替换关系序列化 */
  public static keyValuePairToString(key: Expr, value: Expr): string {
    // eslint-disable-next-line prettier/prettier
    return `${ExprHelper.nodeToString(key)} -> ${ExprHelper.nodeToString(value)}`;
  }
}
