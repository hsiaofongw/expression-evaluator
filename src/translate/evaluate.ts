/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transform, TransformCallback } from 'stream';
import {
  builtInDefinitions,
  NodeFactory,
  SequenceExpr,
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
import { concat, concatAll, from, map, Observable, of, zip } from 'rxjs';

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

  private rootContext: IContext = {
    parent: undefined,
    definitions: {
      builtin: this._builtInDefinitions,
      fixedAssign: this._userFixedDefinition,
      delayedAssign: this._userDelayedDefinition,
      arguments: [],
    },
  };

  constructor(seqNum?: number) {
    super({ objectMode: true });
    if (seqNum !== undefined) {
      this.seqNum = seqNum;
    }
  }

  private getRootContext(): IContext {
    const rootContext: IContext = this.rootContext;
    return rootContext;
  }

  public _transform(
    expr: Expr,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const rootContext = this.getRootContext();
    const result$ = this.evaluate(expr, rootContext);
    result$.subscribe((result) => {
      this.push({ seqNum: this.seqNum, result });
      this.seqNum = this.seqNum + 1;
      callback();
    });
  }

  private makeEmptyContext(): IContext {
    return {
      definitions: {
        arguments: [],
        builtin: [],
        delayedAssign: [],
        fixedAssign: [],
      },
      parent: undefined,
    };
  }

  /** 寻找定义并执行定义规定的操作 */
  private substitute(expr: Expr, context: IContext): Observable<Expr> {
    // 寻找定义
    const definitionQueryResult = this.findDefinition(expr, context);
    if (!definitionQueryResult.pass) {
      // 无定义
      return of(expr);
    }

    // 导入结果
    const newContext: IContext = this.makeEmptyContext();
    const namedResult = definitionQueryResult.namedResult;
    for (const key in namedResult) {
      const keyExpr = NodeFactory.makeSymbol(key);
      const valueExpr = SequenceExpr(namedResult[key]);
      newContext.definitions.arguments.push({
        pattern: keyExpr,
        // 务必要在现在这个父上下文进行求值，而不是在将来那个现场的上下文
        action: (_, evaluator, ___) => evaluator.evaluate(valueExpr, context),
        displayName: ExprHelper.keyValuePairToString(keyExpr, valueExpr),
      });
    }

    // 新建上下文
    newContext.parent = context;

    // 求值
    return definitionQueryResult.definition.action(expr, this, newContext);
  }

  private getRoot(expr: Expr): Expr {
    let head = expr.head;
    while (head.head.head !== head.head) {
      head = head.head;
    }

    return head;
  }

  /** 根据 expr 的 head 的符号（符号原型）的 nonStandard 字段决定是否采用非标准求值流程对 expr 进行求值 */
  public evaluate(expr: Expr, context: IContext): Observable<Expr> {
    const root = this.getRoot(expr);
    const copy = ExprHelper.shallowCopy(expr);
    let result$: Observable<Expr>;
    if (expr.nodeType === 'terminal' && expr.expressionType !== 'symbol') {
      return of(expr);
    } else if (
      root.nodeType === 'terminal' &&
      root.expressionType === 'symbol' &&
      allNonStandardSymbolsSet.has(root.value)
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

  /**
   * 为一个表达式在给定的上下文中寻找定义，
   *
   * todo: 暂时没想好当遇到多个匹配的时候如何处理。
   *
   * update: 现在的想法是这样：对于内建替换规则，精心设计好它们之间的顺序，让「重要」的规则被最早匹配到。
   * 规则定义的替换操作被应用后，在求值器第二次、第三次尝试寻找规则时，适用的规则的数量数会变少，
   * 最终会只剩下唯一一条规则，甚至没有规则可以应用。
   * 这就要求开发者在设计和实现内建规则的 pattern, 求值操作还有规则之间的顺序的时候，要非常小心，
   * 稍有不慎系统可能在求值某个表达式的时候陷入无限循环状态，或者本来能求出来的值求不出来了。
   *
   * @param expr 表达式
   * @param context 上下文
   * @returns 定义查询结果
   */
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

  /** 标准求值程序 */
  private standardEvaluate(expr: Expr, context: IContext): Observable<Expr> {
    const head = expr.head;
    return of([expr, ExprHelper.shallowCopy(head)]).pipe(
      // 对 head 求值
      map(([expr, headExpr]) =>
        this.substitute(headExpr, context).pipe(
          map((evaluatedHead) => {
            expr.head = evaluatedHead;
            return expr;
          }),
        ),
      ),
      concatAll(),

      // 为对 children 求值做准备，提前把每一个 child 做浅复制
      map((expr) => {
        if (expr.nodeType === 'nonTerminal') {
          expr.children = expr.children.map((child) =>
            ExprHelper.shallowCopy(child),
          );
        }
        return expr as Expr;
      }),

      // 尝试对每个 child 求值（如果有的话）
      map((expr) => {
        if (
          (expr.nodeType === 'nonTerminal' && expr.children.length === 0) ||
          expr.nodeType === 'terminal'
        ) {
          return of(expr);
        }

        const exprWithChildrenEvaluated$ = zip(
          expr.children.map((child) =>
            this.evaluate(ExprHelper.shallowCopy(child), context),
          ),
        ).pipe(
          map((children) => {
            expr.children = children;
            return expr as Expr;
          }),
        );
        return exprWithChildrenEvaluated$;
      }),
      concatAll(),

      // 对自己求值
      map((expr) => this.substitute(expr, context)),
      concatAll(),
    );
  }

  /** 非标准求值程序 */
  private nonStandardEvaluate(expr: Expr, context: IContext): Observable<Expr> {
    return this.substitute(expr, context);
  }

  /**
   * 立即赋值，在赋值时就对右表达式进行求值，之后 pattern 将总是被替换为该结果
   *
   * 主要是由 Assign 函数调用, Evaluator 内部尽量不要依赖这个函数，换言之这是对外的
   */
  public assign(keyValuePair: KeyValuePair): Observable<Expr> {
    const lhs = keyValuePair.pattern;
    const rhs = keyValuePair.value;
    this._userFixedDefinition.push({
      pattern: lhs,
      action: (_, __, ___) => rhs,
      displayName: 'lhs -> ?',
    });

    return rhs;
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
    return zip([of(keyValuePair.pattern), keyValuePair.value]).pipe(
      map(([key, value]) => {
        this._userDelayedDefinition.push({
          pattern: key,
          action: (_, evaluator, context) => {
            return evaluator.evaluate(value, context);
          },
          displayName: `${ExprHelper.nodeToString(keyValuePair.pattern)} -> ?`,
        });

        return allSymbolsMap.NothingSymbol;
      }),
    );
  }
}
