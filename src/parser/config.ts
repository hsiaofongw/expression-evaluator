/* eslint-disable prettier/prettier */
import { ArrayHelper } from 'src/helpers/array-helper';
import {
  SyntaxSymbol,
  ProductionRule,
  SymbolType,
  NonterminalSymbolType,
  TerminalSymbolType,
} from './interfaces';

const NonTerminal: (name: NonterminalSymbolType) => SyntaxSymbol = (name) => ({
  id: name,
  type: 'nonTerminal',
});

const Terminal: (name: TerminalSymbolType) => SyntaxSymbol = (name) => ({
  id: name,
  type: 'terminal',
  definition: { tokenClassName: name },
});

export const sb: Record<SymbolType, SyntaxSymbol> = {
  start           : NonTerminal('start'),
  b1              : NonTerminal('b1'),
  b2              : NonTerminal('b2'),
  b3              : NonTerminal('b3'),
  b4              : NonTerminal('b4'),
  b5              : NonTerminal('b5'),
  b6              : NonTerminal('b6'),
  f3              : NonTerminal('f3'),
  l               : NonTerminal('l'),
  assign          : NonTerminal('assign'),
  Substitute      : NonTerminal('Substitute'),
  rule            : NonTerminal('rule'),
  b2l             : NonTerminal('b2l'),
  logic           : NonTerminal('logic'),
  b2_not          : NonTerminal('b2_not'),
  bool            : NonTerminal('bool'),
  e               : NonTerminal('e'),
  ep              : NonTerminal('ep'),
  t               : NonTerminal('t'),
  tp              : NonTerminal('tp'),
  rem             : NonTerminal('rem'),
  f2              : NonTerminal('f2'),
  f1              : NonTerminal('f1'),
  pow             : NonTerminal('pow'),
  f0              : NonTerminal('f0'),
  ptn             : NonTerminal('ptn'),
  f               : NonTerminal('f'),
  id_ext          : NonTerminal('id_ext'),
  params_ext      : NonTerminal('params_ext'),
  base            : NonTerminal('base'),
  Num             : NonTerminal('Num'),
  num_ext         : NonTerminal('num_ext'),
  dot_ext         : NonTerminal('dot_ext'),
  scientific_ext  : NonTerminal('scientific_ext'),
  factorial       : NonTerminal('factorial'),
  dfactorial      : NonTerminal('dfactorial'),
  exclamation     : Terminal('exclamation'),
  equal           : Terminal('equal'),
  eof             : Terminal('eof'),
  plus            : Terminal('plus'),
  minus           : Terminal('minus'),
  times           : Terminal('times'),
  divide          : Terminal('divide'),
  dot             : Terminal('dot'),
  identifier      : Terminal('identifier'),
  string          : Terminal('string'),
  leftAngle       : Terminal('leftAngle'),
  leftAngleColumn : Terminal('leftAngleColumn'),
  leftParentheses : Terminal('leftParentheses'),
  leftBracket     : Terminal('leftBracket'),
  leftAngleEqual  : Terminal('leftAngleEqual'),
  leftSquare      : Terminal('leftSquare'),
  rightAngle      : Terminal('rightAngle'),
  rightAngleEqual : Terminal('rightAngleEqual'),
  rightArrow      : Terminal('rightArrow'),
  rightBracket    : Terminal('rightBracket'),
  rightParentheses: Terminal('rightParentheses'),
  rightSquare     : Terminal('rightSquare'),
  number          : Terminal('number'),
  doubleEqual     : Terminal('doubleEqual'),
  doublePlus      : Terminal('doublePlus'),
  doubleUnderline : Terminal('doubleUnderline'),
  singleUnderline : Terminal('singleUnderline'),
  tripleEqual     : Terminal('tripleEqual'),
  tripleUnderline : Terminal('tripleUnderline'),
  percent         : Terminal('percent'),
  power           : Terminal('power'),
  and             : Terminal('and'),
  or              : Terminal('or'),
  columnEqual     : Terminal('columnEqual'),
  semicolumn      : Terminal('semicolumn'),
  substitute      : Terminal('substitute'),
  columnRightAngle: Terminal('columnRightAngle'),
  columnRightArrow: Terminal('columnRightArrow'),
  comma           : Terminal('comma'),
  comment         : Terminal('comment'),
  blank           : Terminal('blank'),
  notEqual        : Terminal('notEqual'),
  notStrictEqual  : Terminal('notStrictEqual'),
};

/** 文法中的全体非终结符号 */
export const nonTerminalSymbols: SyntaxSymbol[] = ArrayHelper.toArray(
  sb,
).filter((sbl) => sbl.type === 'nonTerminal');

/** 文法中的全体终结符号 */
export const terminalSymbols: SyntaxSymbol[] = ArrayHelper.toArray(sb).filter(
  (sbl) => sbl.type === 'terminal',
);

/** 全体产生式规则 */
export const allRules: ProductionRule[] = [
  {
    name: 'S -> B5',
    lhs: sb.start,
    rhs: [sb.b5],
  },
  {
    name: 'B6 -> B5 L',
    lhs: sb.b6,
    rhs: [sb.b5, sb.l],
  },
  {
    name: 'l -> eps',
    lhs: sb.l,
    rhs: [],
  },
  {
    name: 'l -> , b5 l',
    lhs: sb.l,
    rhs: [sb.comma, sb.b5, sb.l],
  },
  {
    name: 'b5 -> b4 assign',
    lhs: sb.b5,
    rhs: [sb.b4, sb.assign],
  },
  {
    name: 'sub -> /. b3 sub',
    lhs: sb.Substitute,
    rhs: [sb.substitute, sb.b3, sb.Substitute],
  },
  {
    name: 'sub -> eps',
    lhs: sb.Substitute,
    rhs: [],
  },
  {
    name: 'b3 -> b2l rule',
    lhs: sb.b3,
    rhs: [sb.b2l, sb.rule],
  },
  {
    name: 'rule -> -> b2l',
    lhs: sb.rule,
    rhs: [sb.rightArrow, sb.b2l],
  }
];
