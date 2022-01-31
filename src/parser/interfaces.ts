import { TypedToken } from 'src/lexer/interfaces';

export type SyntaxSymbol = {
  id: string;
  name: string;
  description?: string;
  type: 'nonTerminal' | 'terminal';
  displayName?: string;
};

export type ProductionRule = {
  lhs: SyntaxSymbol;
  rhs: SyntaxSymbol[];
};

export type Node = (NonTerminalNode | TerminalNode) & { symbol: SyntaxSymbol };

export type NonTerminalNode = {
  type: 'nonTerminal';
  children: Node[];
};

export type TerminalNode = {
  type: 'terminal';
  token: TypedToken;
};
