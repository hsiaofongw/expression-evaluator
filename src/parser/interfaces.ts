import { TokenClass, TypedToken } from 'src/lexer/interfaces';
import { SyntaxSymbolHelper } from './helpers';

export type SyntaxSymbol = {
  id: string;
  name: string;
  description: string;
  displayName: string;
  zhName: string;
} & (
  | { type: 'nonTerminal' }
  | { type: 'terminal'; definition: { tokenClassName: TokenClass['name'] } }
);

export type ProductionRule = {
  name: string;
  lhs: SyntaxSymbol;
  rhs: SyntaxSymbol[];
};

export type ProductionRuleId = number;

export type Node = NonTerminalNode | TerminalNode;

export type NonTerminalNode = {
  type: 'nonTerminal';
  children: Node[];
  symbol: SyntaxSymbol;
  ruleName: ProductionRule['name'];
};

export type TerminalNode = {
  type: 'terminal';
  token?: TypedToken;
  symbol: SyntaxSymbol;
};

export type SyntaxConfiguration = {
  symbols: SyntaxSymbol[] | Record<string, SyntaxSymbol>;
  rules: ProductionRule[];
  specialSymbol: {
    entrySymbol: SyntaxSymbol;
    epsilonSymbol: SyntaxSymbol;
    endOfFileSymbol: SyntaxSymbol;
  };
};

export type SyntaxAnalysisConfiguration = SyntaxConfiguration & {
  syntaxAnalysisPartner: SyntaxSymbolHelper;
};

export type PredictiveAnalysisTable = Record<
  SyntaxSymbol['id'],
  Record<SyntaxSymbol['id'], ProductionRuleId[]>
>;
