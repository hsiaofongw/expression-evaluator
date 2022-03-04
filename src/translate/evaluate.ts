/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transform, TransformCallback } from 'stream';
import {
  builtInDefinitions,
  NodeFactory,
  Sequence,
  allSymbolsMap,
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
import { ExprHelper, Neo } from 'src/helpers/expr-helpers';

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
      if (symbolPrototype.nonStandard) {
        head.nonStandard = true;
      }
    }

    this.push(expr);
    callback();
  }
}

export class Evaluator extends Transform implements IEvaluateContext {
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
  }

  public _transform(
    expr: Expr,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.evaluate(expr);
    const result = this.popNode();
    this.push(result);
    callback();
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
      if (head.nonStandard) {
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

  private getDefinitions(): Definition[] {
    const flattenArguments: Definition[] = [];
    const stackSize = this._ephemeralDefinitions.length;
    for (let i = 0; i < this._ephemeralDefinitions.length; i++) {
      const frame = this._ephemeralDefinitions[stackSize - 1 - i];
      for (const definition of frame) {
        flattenArguments.push(definition);
      }
    }

    const definitions: Definition[] = [
      ...this._builtInDefinitions,
      ...this._userFixedDefinition,
      ...this._userDelayedDefinition,
      ...flattenArguments,
    ];

    return definitions;
  }

  private standardEvaluate(expr: Expr): void {

    const head = expr.head;

    let applyCount = 0;
    let definitions = this.getDefinitions();

    const match = this.findDefinition(head, definitions);
    if (match.pass) {
      this.applyDefinition(head, match.definition, match.namedResult);
      definitions = this.getDefinitions();
      applyCount = applyCount + 1;
      expr.head = this.popNode();
    }

    if (expr.nodeType === 'nonTerminal') {
      for (let i = 0; i < expr.children.length; i++) {
        const match = this.findDefinition(expr.children[i], definitions);
        if (match.pass) {
          applyCount = applyCount + 1;
          this.applyDefinition(
            expr.children[i],
            match.definition,
            match.namedResult,
          );
          definitions = this.getDefinitions();
          expr.children[i] = this.popNode();
        }
      }
    }

    const matchForExpr = this.findDefinition(expr, definitions);
    let evaluatedExpr = expr;
    if (matchForExpr.pass) {
      applyCount = applyCount + 1;
      this.applyDefinition(
        expr,
        matchForExpr.definition,
        matchForExpr.namedResult,
      );
      definitions = this.getDefinitions();
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
        this.applyDefinition(expr, definition, match.namedResult);
        return;
      }
    }

    this.pushNode(expr);
  }

  private applyDefinition(
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

    this.pushNode(allSymbolsMap.NothingSymbol);
  }
}
