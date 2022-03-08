/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transform, TransformCallback } from 'stream';
import {
  builtInDefinitions,
  NodeFactory,
  Sequence,
  allSymbolsMap,
  allNonStandardSymbolsSet,
} from './config';
import {
  Definition,
  DefinitionType,
  Expr,
  IContext,
  IEvaluator,
  KeyValuePair,
  MatchResult,
  NoMatchResult,
  PatternMatchResult,
} from './interfaces';
import { allSymbols } from './config';
import { ExprHelper, Neo } from 'src/helpers/expr-helpers';
import { concat, concatAll, map, Observable, of, zip } from 'rxjs';

type DefinitionQueryResult =
  | NoMatchResult
  | (MatchResult & { definition: Definition });

export class PreEvaluator extends Transform {
  /** 符号名称到符号对象的映射 */
  private _symbolNameMap: Record<string, Expr> = {};

  constructor() {
    super({ objectMode: true });

    const symbolNameMap: Record<string, Expr> = {};
    for (const sbl of allSymbols) {
      if (sbl.nodeType === 'terminal' && sbl.expressionType === 'symbol') {
        symbolNameMap[sbl.value] = sbl;
      }
    }
    this._symbolNameMap = symbolNameMap;
  }

  public _transform(
    expr: Expr,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const head = expr.head;
    if (head.nodeType === 'terminal' && head.expressionType === 'symbol') {
      const symbolName = head.value;
      const symbolPrototype = this._symbolNameMap[symbolName] as typeof head;
      if (symbolPrototype !== undefined) {
        if (symbolPrototype.nonStandard) {
          head.nonStandard = true;
        }
      }
    }

    this.push(expr);
    callback();
  }
}

export class Evaluator extends Transform implements IEvaluator {
  /** 系统内建定义，这里的都是按照非标准求值程序进行 */
  private _builtInDefinitions: Definition[] = builtInDefinitions;

  /** 用户使用 Assign 指令下的全局定义 */
  private _userFixedDefinition: Definition[] = [];

  /** 用户使用 AssignDelayed 指令下的全局定义 */
  private _userDelayedDefinition: Definition[] = [];

  /** 序列号 */
  private seqNum = 0;

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

  constructor(seqNum?: number) {
    super({ objectMode: true });
    if (seqNum !== undefined) {
      this.seqNum = seqNum;
    }
  }

  private getRootContext(): IContext {
    const rootContext: IContext = {
      parent: undefined,
      definitions: {
        builtin: this._builtInDefinitions,
        fixedAssign: this._userFixedDefinition,
        delayedAssign: this._userDelayedDefinition,
        arguments: [],
      },
    };
    return rootContext;
  }

  public _transform(
    expr: Expr,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const rootContext = this.getRootContext();
    const result = this.evaluate(expr, rootContext);
    this.push({ seqNum: this.seqNum, result });
    this.seqNum = this.seqNum + 1;
    callback();
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
  public evaluate(expr: Expr, context: IContext): Observable<Expr> {
    const head = expr.head;
    const copy = ExprHelper.shallowCopy(expr);
    let result$: Observable<Expr>;
    if (
      head.nodeType === 'terminal' &&
      head.expressionType === 'symbol' &&
      allNonStandardSymbolsSet.has(head.value)
    ) {
      result$ = this.nonStandardEvaluate(copy, context);
    } else {
      result$ = this.standardEvaluate(copy, context);
    }

    return result$.pipe(
      map((result) => {
        if (ExprHelper.rawEqualQ([expr], [result])) {
          return of(result);
        } else {
          return this.evaluate(result, context);
        }
      }),
      concatAll(),
    );
  }

  private findDefinition(expr: Expr, context: IContext): DefinitionQueryResult {
    let contextPtr = context;
    const queryOrder: DefinitionType[] = [
      'arguments',
      'fixedAssign',
      'delayedAssign',
      'builtin',
    ];
    while (contextPtr !== undefined) {
      for (const cat of queryOrder) {
        for (const definition of contextPtr.definitions[cat]) {
          const match = Neo.patternMatch([expr], [definition.pattern]);
          if (match.pass) {
            return { ...match, definition: definition };
          }
        }
      }
      contextPtr = contextPtr.parent;
    }
    return { pass: false };
  }

  private appendToContext(
    parent: IContext,
    namedResult: Record<string, Expr[]>,
  ): IContext {
    const newContext: IContext = {
      parent: parent,
      definitions: {
        arguments: [],
        builtin: [],
        delayedAssign: [],
        fixedAssign: [],
      },
    };
    for (const key in namedResult) {
      const exprs: Expr[] = namedResult[key];
      const sequence: Expr = {
        nodeType: 'nonTerminal',
        head: allSymbolsMap.SequenceSymbol,
        children: [...exprs],
      };
      const keyExpr = NodeFactory.makeSymbol(key);
      newContext.definitions.arguments.push({
        pattern: keyExpr,
        action: (_, __, ___) => of(sequence),
        displayName: ExprHelper.keyValuePairToString(keyExpr, sequence),
      });
    }

    return newContext;
  }

  private takeAction(
    expr: Expr,
    definition: Definition,
    parentContext: IContext,
    namedResult: Record<string, Expr[]>,
  ): Observable<Expr> {
    return of(namedResult).pipe(
      map((namedResult) => {
        const keyValuePairs: { key: string; idx: number; value: Expr }[] = [];
        for (const key in namedResult) {
          for (let idx = 0; idx < namedResult[key].length; idx = idx + 1) {
            keyValuePairs.push({ key, idx, value: namedResult[key][idx] });
          }
        }
        return keyValuePairs;
      }),
      map((pairs) => {
        const op = (k: string, i: number, v: Expr) =>
          this.evaluate(v, parentContext).pipe(
            map((res) => ({ key: k, idx: i, value: res })),
          );
        return zip(pairs.map((pair) => op(pair.key, pair.idx, pair.value)));
      }),
      concatAll(),
      map((pairs) => {
        const newNamedResult: Record<string, Expr[]> = {};
        for (const pair of pairs) {
          if (newNamedResult[pair.key] === undefined) {
            newNamedResult[pair.key] = [];
          }
          newNamedResult[pair.key][pair.idx] = pair.value;
        }
        return newNamedResult;
      }),
      map((newNamedResult) => {
        return definition.action(
          expr,
          this,
          this.appendToContext(parentContext, newNamedResult),
        );
      }),
      concatAll(),
      map((evaluated) => {
        this.stripSequenceSymbolFromExpr(evaluated);
        return evaluated;
      }),
    );
  }

  /** 标准求值程序 */
  private standardEvaluate(expr: Expr, context: IContext): Observable<Expr> {
    return of(expr).pipe(
      // 浅复制
      map((expr) => ExprHelper.shallowCopy(expr)),

      // 对头部求值
      map((expr) => {
        const match = this.findDefinition(expr.head, context);
        if (match.pass) {
          const newHead$ = this.takeAction(
            expr.head,
            match.definition,
            context,
            match.namedResult,
          );
          return newHead$.pipe(
            map((head) => {
              expr.head = head;
              return expr;
            }),
          );
        }

        return of(expr);
      }),
      concatAll(),

      // 对 children 中的每一个分别求值
      map((expr) => {
        if (expr.nodeType === 'nonTerminal') {
          const children$ = expr.children.map((child) => {
            const match = this.findDefinition(child, context);
            if (match.pass) {
              return this.takeAction(
                child,
                match.definition,
                context,
                match.namedResult,
              );
            }
            return of(child);
          });

          return zip(children$).pipe(
            map((children) => {
              expr.children = children;
              return expr as Expr;
            }),
          );
        }

        return of(expr);
      }),
      concatAll(),

      // 展开 Sequence 符号
      map((expr) => {
        this.stripSequenceSymbolFromExpr(expr);
        return expr;
      }),

      // 对自己求值
      map((expr) => {
        const matchForExpr = this.findDefinition(expr, context);
        if (matchForExpr.pass) {
          return this.takeAction(
            expr,
            matchForExpr.definition,
            context,
            matchForExpr.namedResult,
          );
        }

        return of(expr);
      }),
      concatAll(),
    );
  }

  /** 非标准求值程序 */
  private nonStandardEvaluate(expr: Expr, context: IContext): Observable<Expr> {
    return of(expr).pipe(
      map((expr) => {
        const definitionQuery = this.findDefinition(expr, context);
        if (definitionQuery.pass) {
          return this.takeAction(
            expr,
            definitionQuery.definition,
            context,
            definitionQuery.namedResult,
          );
        }

        return of(expr);
      }),
      concatAll(),
    );
  }

  /**
   * 立即赋值，在赋值时就对右表达式进行求值，之后 pattern 将总是被替换为该结果
   *
   * 主要是由 Assign 函数调用, Evaluator 内部尽量不要依赖这个函数，换言之这是对外的
   */
  public assign(keyValuePair: KeyValuePair): Observable<Expr> {
    const lhs = keyValuePair.pattern;
    const rhs = keyValuePair.value;
    const evaluatedRhs = this.evaluate(rhs, this.getRootContext());
    this._userFixedDefinition.push({
      pattern: lhs,
      action: (_, __, ___) => evaluatedRhs,
      displayName: ExprHelper.keyValuePairToString(lhs, rhs),
    });

    return evaluatedRhs;
  }

  /**
   * 清除赋值
   */
  public clearAssign(pattern: Expr): Observable<Expr> {
    const beforeDefCounts = this._userFixedDefinition.length;
    this._userFixedDefinition = this._userFixedDefinition.filter((userDef) => {
      return !Neo.patternMatch([userDef.pattern], [pattern]).pass;
    });
    const afterDefCounts = this._userFixedDefinition.length;
    return of({
      nodeType: 'terminal',
      expressionType: 'number',
      head: NodeFactory.makeSymbol('Integer'),
      value: beforeDefCounts - afterDefCounts,
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
  public clearDelayedAssign(pattern: Expr): Observable<Expr> {
    const beforeCounts = this._userDelayedDefinition.length;
    this._userDelayedDefinition = this._userDelayedDefinition.filter((def) => {
      return !Neo.patternMatch([def.pattern], [pattern]).pass;
    });
    const afterCounts = this._userDelayedDefinition.length;

    return of({
      nodeType: 'terminal',
      expressionType: 'number',
      head: NodeFactory.makeSymbol('Integer'),
      value: beforeCounts - afterCounts,
    });
  }

  /**
   * 延迟赋值，每次读取时将重新求值
   *
   * 主要是由 AssignDelayed 函数调用, Evaluator 内部尽量不要依赖这个函数，换言之这是对外的
   */
  public assignDelayed(keyValuePair: KeyValuePair): Observable<Expr> {
    const originValue = keyValuePair.value;
    this._userDelayedDefinition.push({
      pattern: keyValuePair.pattern,
      action: (_, evaluator, context) => {
        return evaluator.evaluate(originValue, context);
      },
      displayName: `${ExprHelper.nodeToString(keyValuePair.pattern)} -> ?`,
    });

    return of(allSymbolsMap.NothingSymbol);
  }
}
