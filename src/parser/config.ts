import { ArrayHelper } from 'src/helpers/array-helper';
import { SyntaxSymbol, ProductionRule } from './interfaces';

type NonterminalSymbolType =
  | 'start'
  | 'b6'
  | 'b5'
  | 'b4'
  | 'b3'
  | 'b2'
  | 'b1'
  | 'l'
  | 'assign'
  | 'eps'
  | 'substitute'
  | 
type TerminalSymbolType = 'equal';

type SymbolType = NonterminalSymbolType | TerminalSymbolType;

export const allSymbols: Record<SymbolType, SyntaxSymbol> = {
  start: { id: 'start', type: 'nonTerminal' },
  b1: { id: 'b1', type: 'nonTerminal' },
  b2: { id: 'b2', type: 'nonTerminal' },
  b3: { id: 'b3', type: 'nonTerminal' },
  b4: { id: 'b4', type: 'nonTerminal' },
  b5: { id: 'b5', type: 'nonTerminal' },
  b6: { id: 'b6', type: 'nonTerminal' },
  l: { id: 'l', type: 'nonTerminal' },

  equal: {
    id: 'singleEqual',
    type: 'terminal',
    definition: {
      tokenClassName: 'equal',
    },
  },
};

/** 文法中的全体非终结符号 */
export const nonTerminalSymbols: SyntaxSymbol[] = ArrayHelper.toArray(
  allSymbols,
).filter((sbl) => sbl.type === 'nonTerminal');

/** 文法中的全体终结符号 */
export const terminalSymbols: SyntaxSymbol[] = ArrayHelper.toArray(
  allSymbols,
).filter((sbl) => sbl.type === 'terminal');

/** 全体产生式规则 */
export const allRules: ProductionRule[] = [
  {
    name: 'S -> B5',
    lhs: allSymbols.start,
    rhs: [allSymbols.b5],
  },
  {
    name: 'B6 -> B5 L',
    lhs: allSymbols.b6,
    rhs: [allSymbols.b5, allSymbols.l],
  },
];
