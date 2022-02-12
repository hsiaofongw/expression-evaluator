export type SymbolExpressionType = {
  expressionType: 'symbol';
  value: string;
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

export interface IEvaluateContext {
  /** 求值，最终的求值结果在栈顶 */
  evaluate(node: Expr): void;

  /** 弹出栈顶的那个值（如果有） */
  popNode(): Expr;

  /** 将一个值入栈 */
  pushNode(node: Expr): void;

  /** 模式匹配 */
  matchQ(node: Expr, pattern: Expr): boolean;
}

export type Definition = {
  pattern: Expr;
  action: (node: Expr, context: IEvaluateContext) => void;
};

export type PatternMatchResult =
  | { pass: false }
  | { pass: true; name?: string; exprs: Expr[] };

export type SuccessfulSequenceMatchResult = {
  pass: true;
  result: Record<string, Expr[]>;
};
export type SequenceMatchResult =
  | { pass: false }
  | SuccessfulSequenceMatchResult;

export type PatternAction = {
  forPattern: (pattern: Expr) => boolean;

  // will modify sequenceList in place, and return does the sequence pass this pattern
  action: (
    sequenceList: Expr[],
    pattern: Expr,
    context: IEvaluateContext,
  ) => PatternMatchResult;
};
