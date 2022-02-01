import { TokenClass, TypedToken } from 'src/lexer/interfaces';

export type SyntaxSymbol = {
  id: string;
  name: string;
  description?: string;

  displayName?: string;
} & (
  | { type: 'nonTerminal' }
  | { type: 'terminal'; definition: { tokenClassName: TokenClass['name'] } }
);

export type ProductionRule = {
  lhs: SyntaxSymbol;
  rhs: SyntaxSymbol[];
};

export type ProductionRuleId = number;

export type Node = (NonTerminalNode | TerminalNode) & { symbol: SyntaxSymbol };

export type NonTerminalNode = {
  type: 'nonTerminal';
  children: Node[];
};

export type TerminalNode = {
  type: 'terminal';
  token: TypedToken;
};
