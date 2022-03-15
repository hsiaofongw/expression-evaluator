import { Observable } from 'rxjs';

export type SymbolAtomType = {
  /** 表达式类型：符号 */
  expressionType: 'symbol';

  /** 符号名 */
  value: string;

  /** 是否按照非标准程序求值 */
  nonStandard?: boolean;
};

export type StringAtomType = {
  expressionType: 'string';
  value: string;
};

export type NumberAtomType = {
  expressionType: 'number';
  value: number;
};

export type BooleanAtomType = {
  expressionType: 'boolean';
  value: boolean;
};

export type ExprHead = { head: Expr };

export type TerminalNodeType = { nodeType: 'terminal' };

export type TerminalSymbolExpr = ExprHead & TerminalNodeType & SymbolAtomType;
export type TerminalStringExpr = ExprHead & TerminalNodeType & StringAtomType;
export type TerminalNumberExpr = ExprHead & TerminalNodeType & NumberAtomType;
export type TerminalBooleanExpr = ExprHead & TerminalNodeType & BooleanAtomType;

export type NonTerminalNodeType = { nodeType: 'nonTerminal' };

export type TerminalExpr =
  | TerminalSymbolExpr
  | TerminalStringExpr
  | TerminalNumberExpr
  | TerminalBooleanExpr;

export type NonTerminalExpr = ExprHead &
  NonTerminalNodeType & { children: Expr[] };

export type Expr = TerminalExpr | NonTerminalExpr;

export type KeyValuePair = { pattern: Expr; value: Observable<Expr> };

export interface IEvaluator {
  /** 求值，最终的求值结果在栈顶 */
  evaluate(node: Expr, context: IContext): Observable<Expr>;

  /** 立即赋值 */
  assign(keyValuePairs: KeyValuePair): Observable<Expr>;

  /** 延迟赋值 */
  assignDelayed(keyValuePairs: KeyValuePair): Observable<Expr>;

  /** 清除立即赋值 */
  clearAssign(pattern: Expr): Observable<Expr>;

  /** 清除延迟赋值 */
  clearDelayedAssign(pattern: Expr): Observable<Expr>;
}

export type Definition = {
  /** 该条规则可被应用于何种模式 */
  pattern: Expr;

  /** 该条规则如何改写被应用的表达式 */
  action: (
    node: Expr,
    evaluator: IEvaluator,
    context: IContext,
  ) => Observable<Expr>;

  /** 显示名称 */
  displayName: string;

  /** 是否是强定义 */
  isStrong?: boolean;
};

export type NoMatchResult = { pass: false };
export type MatchResult = { pass: true; namedResult: Record<string, Expr[]> };

export type PatternMatchResult = NoMatchResult | MatchResult;

export type DefinitionType =
  | 'builtin'
  | 'fixedAssign'
  | 'delayedAssign'
  | 'arguments';

export type IContext = {
  parent: IContext | undefined;
  definitions: Record<DefinitionType, Definition[]>;
};

export type EvaluateResultObject = { seqNum: number; result: Expr };

export type FlushSentinel = ';' | '\n';
