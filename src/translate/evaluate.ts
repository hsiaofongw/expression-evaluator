/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Expr, PatternMatchResult } from './interfaces';

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
