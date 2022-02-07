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
  children: ExpressionNode[];
};

export type ExpressionNode = (TerminalNode | NonTerminalNode) & {
  head: ExpressionNode;
};

export interface IEvaluateContext {
  /** 求值，最终的求值结果在栈顶 */
  evaluate(node: ExpressionNode): void;

  /** 弹出栈顶的那个值（如果有） */
  popNode(): ExpressionNode;

  /** 将一个值入栈 */
  pushNode(node: ExpressionNode): void;

  /** 模式匹配 */
  matchQ(node: ExpressionNode, pattern: ExpressionNode): boolean;
}

export type ExpressionNodeEvaluator = {
  pattern: ExpressionNode;
  action: (node: ExpressionNode, context: IEvaluateContext) => void;
};
