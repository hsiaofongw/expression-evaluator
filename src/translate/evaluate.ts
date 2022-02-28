/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transform } from 'stream';
import {
  builtInDefinitions,
  Sequence,
  NodeFactory,
  patternActions,
  SequenceSymbol,
} from './config';
import {
  Definition,
  Expr,
  IEvaluateContext,
  KeyValuePair,
  PatternMatchResult,
} from './interfaces';

type ComparePair = { lhs: Expr[]; rhs: Expr[] };
type PointerPair = { lPtr: number; rPtr: number };
type Pair = { lhs: Expr[]; rhs: Expr[]; queue: PointerPair[] };
type PatternMatchConfig = {
  lhs: Expr[];
  rhs: Expr[];
  lPtr: number;
  rPtr: number;
};

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

  public static neo(
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

        const restMatch = ExprHelper.neo(lhs, rhs, lhsPtr + 1, rhsPtr + 1);
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
          const reMatch = ExprHelper.neo(lhs, rhs, lhsPtr, rhsPtr);
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

          const restMatch = ExprHelper.neo(lhs, rhs, lhsPtr + 1, rhsPtr + 1);
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
          const headMatch = ExprHelper.neo(lhs, rhs, lhsPtr, rhsPtr);
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
          let lhsPtrOffset = 0;
          const remainLength = lhs.length - lhsPtr;
          let matchResult: Record<string, Expr[]> = {};
          while (lhsPtrOffset < remainLength) {
            const match = ExprHelper.neo(
              lhs,
              rhs,
              lhsPtr + lhsPtrOffset + 1,
              rhsPtr + 1,
            );
            if (!match.pass) {
              break;
            }

            matchResult = match.namedResult;
            lhsPtrOffset = lhsPtrOffset + 1;
          }

          if (lhsPtrOffset === 0) {
            return { pass: false };
          }

          matchResult[rhsPtr.toString()] = lhs.slice(
            lhsPtr,
            lhsPtr + lhsPtrOffset,
          );

          return { pass: true, namedResult: matchResult };
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
            const match = ExprHelper.neo(lhsTemp, rhsTemp, 0, 0);
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
        }
      }
    }

    return { pass: false };
  }

  public static _patternMatch(config: PatternMatchConfig): Expr[][] {
    let i = config.lPtr;
    let j = config.rPtr;
    const lhs = config.lhs;
    const rhs = config.rhs;
    const matchedPtrs: number[] = [];
    while (i < lhs.length && j < rhs.length) {
      const l = lhs[i];
      const _r = rhs[j];
      let r = _r;
      if (
        _r.nodeType === 'nonTerminal' &&
        _r.children.length === 2 &&
        _r.head.nodeType === 'terminal' &&
        _r.head.expressionType === 'symbol' &&
        _r.head.value === 'Pattern'
      ) {
        r = _r.children[0];
      }

      if (r.nodeType === 'terminal') {
        if (!ExprHelper.rawEqualQ([l], [r])) {
          return [];
        }

        i = i + 1;
        j = j + 1;
        matchedPtrs.push(j);
        continue;
      } else if (
        r.children.length === 0 &&
        r.head.nodeType === 'terminal' &&
        r.head.expressionType === 'symbol' &&
        r.head.value === 'Blank'
      ) {
        // as for Blank[]
        i = i + 1;
        j = j + 1;
        matchedPtrs.push(j);
        continue;
      } else if (
        r.children.length === 1 &&
        r.head.nodeType === 'terminal' &&
        r.head.expressionType === 'symbol' &&
        r.head.value === 'Blank'
      ) {
        // as for Blank[x], where x is arbitrary Expr
        const expectedHead = r.children[0];
        const inputHead = l.head;
        const match = ExprHelper._patternMatch({
          lhs: [inputHead],
          rhs: [expectedHead],
          lPtr: 0,
          rPtr: 0,
        });
        if (match.length === 0) {
          // No backtrack for Blank[x] or Blank[],
          // since either of them require that match EXACTLY ONE Expr
          return [];
        }
      } else {
      }
    }

    return [];
  }

  public static patternMatchRecursive(
    lhs: Expr[],
    rhs: Expr[],
    i: number,
    j: number,
  ): PatternMatchResult {
    // 当遇到形如 Pattern[symbol, expr] 的 Pattern 时，如果匹配，则保存匹配结果
    const namedResult: Record<string, Expr[]> = {};

    function isConflict(name: string | undefined, exprs: Expr[]): boolean {
      if (name) {
        if (namedResult[name]) {
          if (namedResult[name].length === exprs.length) {
            if (exprs.length === 0) {
              return true;
            }

            if (ExprHelper.rawEqualQ(namedResult[name], exprs)) {
              return true;
            }
          }
        }
      }

      return false;
    }

    function isNamedResultConflict(
      newNamedResult: Record<string, Expr[]>,
    ): boolean {
      for (const key in namedResult) {
        const oldVal = namedResult[key];
        const newVal = newNamedResult[key];
        if (newVal) {
          if (!ExprHelper.rawEqualQ(oldVal, newVal)) {
            return true;
          }
        }
      }

      return false;
    }

    function absorbNamedResult(incoming: Record<string, Expr[]>): void {
      for (const key in incoming) {
        namedResult[key] = incoming[key];
      }
    }

    function match(name: string | undefined, exprs: Expr[]): void {
      if (name) {
        namedResult[name] = exprs;
      }
    }

    // 各自遍历 lhs 队列和 rhs 队列
    while (i < lhs.length && j < rhs.length) {
      const l = lhs[i];

      // 处理 r 形如 Pattern[x, expr] 的情形
      let r = rhs[j];
      let currentPatternName: undefined | string = undefined;
      if (r.nodeType === 'nonTerminal') {
        const head = r.head;
        if (
          head.nodeType === 'terminal' &&
          head.expressionType === 'symbol' &&
          head.value === 'Pattern'
        ) {
          if (r.children.length === 2) {
            const v1 = r.children[0];
            const v2 = r.children[1];
            if (v1.nodeType === 'terminal' && v1.expressionType === 'symbol') {
              currentPatternName = v1.value;
              r = v2;
            }
          }
        }
      }

      if (r.nodeType === 'terminal') {
        if (
          ExprHelper.rawEqualQ([l], [r]) &&
          !isConflict(currentPatternName, [l])
        ) {
          i = i + 1;
          j = j + 1;
          match(currentPatternName, [l]);
          continue;
        }

        return { pass: false };
      } else {
        // r.nodeType === 'nonTerminal'
        if (
          r.head.nodeType === 'terminal' &&
          r.head.expressionType === 'symbol'
        ) {
          if (r.head.value === 'Blank' && r.children.length === 0) {
            // Blank[]
            if (isConflict(currentPatternName, [l])) {
              return { pass: false };
            }
            match(currentPatternName, [l]);
            i = i + 1;
            j = j + 1;
            continue;
          } else if (r.head.value === 'Blank' && r.children.length === 1) {
            // Blank[h]
            const expectHead = r.children[0];
            const matchHead = ExprHelper.patternMatchRecursive(
              [l.head],
              [expectHead],
              0,
              0,
            );

            if (!matchHead.pass) {
              // l.head is by no means like expectHead
              return { pass: false };
            }

            // l.head is fully equal to expectHead
            if (isNamedResultConflict(matchHead.namedResult)) {
              return { pass: false };
            }
            absorbNamedResult(matchHead.namedResult);

            if (isConflict(currentPatternName, [l.head])) {
              return { pass: false };
            }

            match(currentPatternName, [l.head]);

            i = i + 1;
            j = j + 1;
            continue;
          } else if (
            r.head.value === 'BlankSequence' &&
            r.children.length === 0
          ) {
            // BlankSequence[]

            // 看同样的 patternName 是否已有匹配，如果已经有匹配的，则没有必要回溯了
            if (currentPatternName && namedResult[currentPatternName]) {
              const prevRes = namedResult[currentPatternName];
              const current = lhs.slice(i, i + prevRes.length);
              if (!ExprHelper.rawEqualQ(prevRes, current)) {
                return { pass: false };
              }

              const maxI = Math.min(lhs.length, i + prevRes.length);
              const restMatch = ExprHelper.patternMatchRecursive(
                lhs,
                rhs,
                maxI,
                j + 1,
              );

              if (!restMatch.pass) {
                return { pass: false };
              }

              if (isNamedResultConflict(restMatch.namedResult)) {
                return { pass: false };
              }

              absorbNamedResult(restMatch.namedResult);
              return { pass: true, namedResult };
            }

            // 进入扩张过程
            // 不用考虑 currentPatternName 的问题，就当它不存在
            let maxI = lhs.length;
            const minI = i + 1;

            // 进入回溯过程
            // 需要考虑 currentPatternName 以及 restMatch 的 namedResult 之间可能产生的冲突 (conflicts)
            while (maxI >= minI) {
              const restMatch = ExprHelper.patternMatchRecursive(
                lhs,
                rhs,
                maxI,
                j + 1,
              );

              if (restMatch.pass) {
                if (!isNamedResultConflict(restMatch.namedResult)) {
                  if (!isConflict(currentPatternName, lhs.slice(i, maxI))) {
                    absorbNamedResult(restMatch.namedResult);
                    return { pass: true, namedResult };
                  }
                }
              }

              maxI = maxI - 1;
            }

            // 用完了所有的回溯路径，却仍然没有匹配到任何东西
            return { pass: false };
          } else if (
            r.head.value === 'BlankSequence' &&
            r.children.length === 1
          ) {
            if (currentPatternName && namedResult[currentPatternName]) {
              const prevRes = namedResult[currentPatternName];
              const currentVal = lhs.slice(i, i + prevRes.length);
              if (!ExprHelper.rawEqualQ(prevRes, currentVal)) {
                return { pass: false };
              }

              const restMatch = ExprHelper.patternMatchRecursive(
                lhs,
                rhs,
                i + prevRes.length,
                j + 1,
              );

              if (!restMatch.pass) {
                return { pass: false };
              }

              if (isNamedResultConflict(restMatch.namedResult)) {
                return { pass: false };
              }

              absorbNamedResult(restMatch.namedResult);
              return { pass: true, namedResult };
            }

            // BlankSequence[h]
            const expectHead = r.children[0];

            // 开始进入扩张阶段，先尽可能多地为 BlankSequence[h] 匹配 exprs
            let maxI = i;
            const tempNamedResult: Record<string, Expr[]> = {};
            for (const key in namedResult) {
              tempNamedResult[key] = namedResult[key];
            }
            while (maxI < lhs.length) {
              const headMatch = ExprHelper.patternMatchRecursive(
                [l.head],
                [expectHead],
                0,
                0,
              );

              if (!headMatch.pass) {
                break;
              }

              let conflict = false;
              for (const key in headMatch.namedResult) {
                if (tempNamedResult[key]) {
                  if (
                    !ExprHelper.rawEqualQ(
                      tempNamedResult[key],
                      headMatch.namedResult[key],
                    )
                  ) {
                    conflict = true;
                    break;
                  }
                }
                tempNamedResult[key] = headMatch.namedResult[key];
              }

              if (tempNamedResult[currentPatternName]) {
                conflict = true;
              }

              if (conflict) {
                break;
              }

              maxI = maxI + 1;
            }

            if (maxI === i) {
              // BlankSequence[h] 至少要匹配一个
              return { pass: false };
            }

            // 扩张阶段结束，接下来进入回溯阶段
            let restMatch: undefined | PatternMatchResult = undefined;
            while (maxI >= i) {
              restMatch = ExprHelper.patternMatchRecursive(
                lhs,
                rhs,
                maxI,
                j + 1,
              );

              if (restMatch.pass) {
                if (!isNamedResultConflict(restMatch.namedResult)) {
                  if (!currentPatternName) {
                    absorbNamedResult(restMatch.namedResult);
                    return { pass: true, namedResult };
                  } else {
                    const currentPatternVal = lhs.slice(i, maxI + 1);
                    const restPatternVal =
                      restMatch.namedResult[currentPatternName];
                    if (
                      ExprHelper.rawEqualQ(currentPatternVal, restPatternVal)
                    ) {
                      absorbNamedResult(restMatch.namedResult);
                      return { pass: true, namedResult };
                    }
                  }
                }
              }

              maxI = maxI - 1;
            }

            // 回溯完毕，无可用路径
            return { pass: false };
          } else if (
            r.head.value === 'BlankNullSequence' &&
            r.children.length === 0
          ) {
            // BlankNullSequence[] like
            let maxI = lhs.length;
            const minI = i + 1;

            // 扩张阶段，需要针对 namedResult[currentPatternName] 情形做单独考虑
            // 事实上，如果 namedResult[currentPatternName] 存在，则也就没有回溯的必要了
            if (currentPatternName && namedResult[currentPatternName]) {
              // 之前已经匹配过同样的 pattern, 无回溯
              const prevExprs = namedResult[currentPatternName];
              const currentVal = lhs.slice(i, i + prevExprs.length - 1);

              if (!ExprHelper.rawEqualQ(prevExprs, currentVal)) {
                return { pass: false };
              }

              maxI = i + prevExprs.length;
              const restMatch = ExprHelper.patternMatchRecursive(
                lhs,
                rhs,
                maxI,
                j + 1,
              );

              if (
                restMatch.pass === false ||
                isNamedResultConflict(restMatch.namedResult) === true
              ) {
                return { pass: false };
              }

              absorbNamedResult(restMatch.namedResult);

              return { pass: true, namedResult: namedResult };
            }

            // 回溯阶段
            while (maxI >= minI) {
              const restMatch = ExprHelper.patternMatchRecursive(
                lhs,
                rhs,
                maxI,
                j + 1,
              );

              if (
                restMatch.pass &&
                !isNamedResultConflict(restMatch.namedResult)
              ) {
                absorbNamedResult(restMatch.namedResult);
                return { pass: true, namedResult };
              }

              maxI = maxI - 1;
            }

            // 当前 BlankNullSequence[] 匹配了 0 个
            j = j + 1;
          }
        }
      }
    }

    if (i !== lhs.length || j !== rhs.length) {
      // 仍有 expr 或者 pattern 没被消化掉
      return { pass: false };
    }

    return { pass: true, namedResult: namedResult };
  }
}

// export class Evaluator extends Transform implements IEvaluateContext {
//   private _exprStack: Expr[] = [];
//   private _builtInDefinitions: Definition[] = builtInDefinitions;
//   private _userDefinitionStack: Definition[][] = [];

//   constructor() {
//     super({ objectMode: true });
//     this._exprStack = [];
//   }

//   public pushNode(n: Expr): void {
//     this._exprStack.push(n);
//   }

//   public popNode(): Expr {
//     return this._exprStack.pop() as Expr;
//   }

//   /**
//    * （后续这块得好好优化，一定有更好的方法）
//    *
//    * 给定一个表达式 expr, 寻找它的重写规则，先在用户定义规则栈里边找，再在系统内置符号栈里边找
//    *
//    * 如果找不到，返回 undefined
//    */
//   private _findDefinition(expr: Expr): DefinitionAndMatchResult | undefined {
//     // 从栈顶找到栈底
//     for (let i = 0; i < this._userDefinitionStack.length; i++) {
//       const defStack =
//         this._userDefinitionStack[this._userDefinitionStack.length - 1 - i];

//       // 从左到右
//       for (let j = 0; j < defStack.length; j++) {
//         const definition = defStack[j];
//         const matchResult = ExprHelper.patternMatch(
//           expr,
//           definition.pattern,
//           this,
//         );
//         if (matchResult.pass) {
//           return { definition, matchResult: matchResult };
//         }
//       }
//     }

//     // 系统内置符号顺序关系不大，直接线性搜索
//     for (let i = 0; i < this._builtInDefinitions.length; i++) {
//       const definition = this._builtInDefinitions[i];
//       const matchResult = ExprHelper.patternMatch(
//         expr,
//         definition.pattern,
//         this,
//       );
//       if (matchResult.pass) {
//         return { definition, matchResult: matchResult };
//       }
//     }

//     return undefined;
//   }

//   /** 将表达式中的 Sequence 展开 */
//   private _flattenSequence(expr: Expr): void {
//     if (expr.nodeType === 'nonTerminal') {
//       const children: Expr[] = [];
//       for (const child of expr.children) {
//         if (
//           child.nodeType === 'nonTerminal' &&
//           ExprHelper.l0Compare(child.head, SequenceSymbol)
//         ) {
//           for (const item of child.children) {
//             children.push(item);
//           }
//         } else {
//           children.push(child);
//         }
//       }

//       expr.children = children;
//     }
//   }

//   private _applyDefinition(def: DefinitionAndMatchResult): void {
//     // 取出当前表达式
//     const expr = this.popNode() as Expr;

//     // 传入实参
//     const keyValuePairs: KeyValuePair[] = [];
//     for (const symbolName in def.matchResult.result) {
//       keyValuePairs.push({
//         pattern: NodeFactory.makeSymbol(symbolName),
//         value: Sequence(def.matchResult.result[symbolName]),
//       });
//     }
//     this._assignImmediately(keyValuePairs);

//     // 求值
//     def.definition.action(expr, this);

//     // 恢复现场
//     this._undoLastAssign();
//   }

//   /** 对表达式进行求值，如果有规则，按规则来，如果没有，原样返回（到栈顶） */
//   public evaluate(expr: Expr): void {
//     const definitionAndMatchResult = this._findDefinition(expr);
//     if (!definitionAndMatchResult) {
//       this.pushNode(expr);
//       return;
//     }

//     const evaluateList: Expr[] = [expr];
//     while (evaluateList.length > 0) {
//       const expr = evaluateList.pop() as Expr;
//       this.pushNode(expr);

//       if (expr.nodeType === 'terminal') {
//         if (expr.expressionType === 'symbol') {
//           const definition = this._findDefinition(expr);
//           if (definition) {
//             this._applyDefinition(definition);
//           }
//         } else {
//         }
//       }
//     }

//     // 输出结果
//     const value = this.popNode() as Expr;
//     this.push(value);
//   }

//   /** 弹出用户定义栈，相当于撤销最近一次赋值操作 */
//   private _undoLastAssign(): void {
//     this._userDefinitionStack.pop();
//   }

//   /** 立即赋值，且不对右值进行求值 */
//   private _assignImmediately(keyValuePairs: KeyValuePair[]): void {
//     const defStack: Definition[] = [];
//     for (const pair of keyValuePairs) {
//       const { pattern, value } = pair;
//       defStack.push({
//         pattern: pattern,
//         action: (_, context) => {
//           context.pushNode(value);
//         },
//       });
//     }
//     this._userDefinitionStack.push(defStack);
//   }

//   /** 立即赋值，在赋值时就对右表达式进行求值，之后 pattern 将总是被替换为该结果 */
//   public assign(keyValuePairs: KeyValuePair[]): void {
//     const defStack: Definition[] = [];
//     for (const pair of keyValuePairs) {
//       const { pattern, value } = pair;
//       this.evaluate(value);
//       const evaluated = this.popNode() as Expr;
//       defStack.push({
//         pattern: pattern,
//         action: (_, context) => {
//           // 结果值以闭包的形式保存下来了
//           context.pushNode(evaluated);
//         },
//       });
//     }
//     this._userDefinitionStack.push(defStack);
//   }

//   /** 延迟赋值，每次读取时将重新求值 */
//   public assignDelayed(keyValuePairs: KeyValuePair[]): void {
//     const defStack: Definition[] = [];
//     for (const pair of keyValuePairs) {
//       const { pattern, value } = pair;
//       defStack.push({
//         pattern: pattern,
//         action: (_, context) => {
//           // 原值以闭包的形式保存下来了
//           this.evaluate(value);
//           const evaluated = this.popNode() as Expr;
//           context.pushNode(evaluated);
//         },
//       });
//     }
//     this._userDefinitionStack.push(defStack);
//   }
// }
