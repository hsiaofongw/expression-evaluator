import { Token, TokenType } from 'src/new-lexer/interfaces';

export type NonterminalSymbolType =
  | 's'
  | 'b6'
  | 'l'
  | 'b5'
  | 'assign'
  | 'b4'
  | 'Substitute'
  | 'b3'
  | 'rule'
  | 'b2l'
  | 'logic'
  | 'b2_not'
  | 'b2'
  | 'bool'
  | 'e'
  | 'ep'
  | 't'
  | 'tp'
  | 'f3'
  | 'rem'
  | 'f2'
  | 'f1'
  | 'pow'
  | 'f0'
  | 'pattern_ext'
  | 'pattern_op'
  | 'compound'
  | 'compound_ext'
  | 'compound_ext_2'
  | 'base'
  | 'Number'
  | 'number_ext'
  | 'dot_ext'
  | 'scientific_ext'
  | 'double_factorial';

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
  token?: Token;
  symbol: SyntaxSymbol;
};
