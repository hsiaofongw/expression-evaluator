export type SymbolExpressionType = {
  /** 表达式类型：符号 */
  expressionType: 'symbol';

  /** 符号名 */
  value: string;

  /** 是否按照非标准程序求值 */
  nonStandard?: boolean;
};

export type StringExpressionType = {
  expressionType: 'string';
  value: string;
};

export type NumberExpressionType = {
  expressionType: 'number';
  value: number;
};

export type BooleanExpressionType = {
  expressionType: 'boolean';
  value: boolean;
};

export type ExpressionType =
  | SymbolExpressionType
  | StringExpressionType
  | NumberExpressionType
  | BooleanExpressionType;

export type TerminalNode = {
  nodeType: 'terminal';
} & ExpressionType;

export type NonTerminalNode = {
  nodeType: 'nonTerminal';
  children: Expr[];
};

export type Expr = (TerminalNode | NonTerminalNode) & {
  head: Expr;
};

export type KeyValuePair = { pattern: Expr; value: Expr };

export interface IEvaluator {
  /** 求值，最终的求值结果在栈顶 */
  evaluate(node: Expr, context: IContext): Expr;

  /** 立即赋值 */
  assign(keyValuePairs: KeyValuePair): Expr;

  /** 延迟赋值 */
  assignDelayed(keyValuePairs: KeyValuePair): Expr;

  /** 清除立即赋值 */
  clearAssign(pattern: Expr): Expr;

  /** 清除延迟赋值 */
  clearDelayedAssign(pattern: Expr): Expr;
}

export type Definition = {
  /** 该条规则可被应用于何种模式 */
  pattern: Expr;

  /** 该条规则如何改写被应用的表达式 */
  action: (node: Expr, evaluator: IEvaluator, context: IContext) => Expr;

  /** 显示名称 */
  displayName: string;
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
