import { TypedToken } from 'src/lexer/interfaces';
import { TokenType } from 'src/new-lexer/interfaces';
import { SyntaxSymbolHelper } from './helpers';

export type NonterminalSymbolType =
  | 'start'
  | 'b6'
  | 'b5'
  | 'b4'
  | 'b3'
  | 'b2'
  | 'b1'
  | 'l'
  | 'assign'
  | 'substitute'
  | 'factorial'
  | 'dfactorial'
  | 'scientific_ext'
  | 'dot_ext'
  | 'num_ext'
  | 'Num'
  | 'base'
  | 'params_ext'
  | 'id_ext'
  | 'f'
  | 'ptn'
  | 'f0'
  | 'pow'
  | 'f1'
  | 'f2'
  | 'rem'
  | 'f3'
  | 'tp'
  | 't'
  | 'ep'
  | 'e'
  | 'bool'
  | 'b2'
  | 'b2_not'
  | 'logic'
  | 'b2l'
  | 'rule';

export type TerminalSymbolType = TokenType;

export type SymbolType = NonterminalSymbolType | TerminalSymbolType;

export type SyntaxSymbolBasic = {
  name?: string;
  description?: string;
  displayName?: string;
  zhName?: string;
};

/** 非终结语法符号，基本上就只有一个名字（也就是 id） */
export type NonTerminalSyntaxSymbol = SyntaxSymbolBasic & {
  id: NonterminalSymbolType;
  type: 'nonTerminal';
};

/** 终结语法符号，除了 id, 还必须指定一个 tokenClassName（类型为 TokenType） */
export type TerminalSyntaxSymbol = SyntaxSymbolBasic & {
  id: TerminalSymbolType;
  type: 'terminal';
  definition: { tokenClassName: TokenType };
};

/** 语法符号分为终结语法符号和非终结语法符号，前者和词法分析中的 TokenType 是一一对应的 */
export type SyntaxSymbol = NonTerminalSyntaxSymbol | TerminalSyntaxSymbol;

/** 语法产生式 */
export type ProductionRule = {
  name: string;
  lhs: SyntaxSymbol;
  rhs: SyntaxSymbol[];
};

export type ProductionRuleId = number;

/** 语法树节点 */
export type Node = NonTerminalNode | TerminalNode;

/** 语法树的分支节点 */
export type NonTerminalNode = {
  type: 'nonTerminal';
  children: Node[];
  symbol: SyntaxSymbol;
  ruleName: ProductionRule['name'];
};

/** 语法树的叶节点 */
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
