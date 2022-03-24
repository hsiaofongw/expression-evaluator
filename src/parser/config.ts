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

export const sbl: Record<SymbolType, SyntaxSymbol> = {
  start: NonTerminal('start'),
  b1: NonTerminal('b1'),
  b2: NonTerminal('b2'),
  b3: NonTerminal('b3'),
  b4: NonTerminal('b4'),
  b5: NonTerminal('b5'),
  b6: NonTerminal('b6'),
  f3: NonTerminal('f3'),
  l: NonTerminal('l'),
  assign: NonTerminal('assign'),
  Substitute: NonTerminal('Substitute'),
  rule: NonTerminal('rule'),
  b2l: NonTerminal('b2l'),
  logic: NonTerminal('logic'),
  b2_not: NonTerminal('b2_not'),
  bool: NonTerminal('bool'),
  e: NonTerminal('e'),
  ep: NonTerminal('ep'),
  t: NonTerminal('t'),
  tp: NonTerminal('tp'),
  rem: NonTerminal('rem'),
  f2: NonTerminal('f2'),
  f1: NonTerminal('f1'),
  pow: NonTerminal('pow'),
  f0: NonTerminal('f0'),
  ptn: NonTerminal('ptn'),
  f: NonTerminal('f'),
  id_ext: NonTerminal('id_ext'),
  params_ext: NonTerminal('params_ext'),
  base: NonTerminal('base'),
  Num: NonTerminal('Num'),
  num_ext: NonTerminal('num_ext'),
  dot_ext: NonTerminal('dot_ext'),
  scientific_ext: NonTerminal('scientific_ext'),
  factorial: NonTerminal('factorial'),
  dfactorial: NonTerminal('dfactorial'),
  exclamation: Terminal('exclamation'),
  equal: Terminal('equal'),
  eof: Terminal('eof'),
  plus: Terminal('plus'),
  minus: Terminal('minus'),
  times: Terminal('times'),
  divide: Terminal('divide'),
  dot: Terminal('dot'),
  identifier: Terminal('identifier'),
  string: Terminal('string'),
  leftAngle: Terminal('leftAngle'),
  leftAngleColumn: Terminal('leftAngleColumn'),
  leftParentheses: Terminal('leftParentheses'),
  leftBracket: Terminal('leftBracket'),
  leftAngleEqual: Terminal('leftAngleEqual'),
  leftSquare: Terminal('leftSquare'),
  rightAngle: Terminal('rightAngle'),
  rightAngleEqual: Terminal('rightAngleEqual'),
  rightArrow: Terminal('rightArrow'),
  rightBracket: Terminal('rightBracket'),
  rightParentheses: Terminal('rightParentheses'),
  rightSquare: Terminal('rightSquare'),
  number: Terminal('number'),
  doubleEqual: Terminal('doubleEqual'),
  doublePlus: Terminal('doublePlus'),
  doubleUnderline: Terminal('doubleUnderline'),
  singleUnderline: Terminal('singleUnderline'),
  tripleEqual: Terminal('tripleEqual'),
  tripleUnderline: Terminal('tripleUnderline'),
  percent: Terminal('percent'),
  power: Terminal('power'),
  and: Terminal('and'),
  or: Terminal('or'),
  columnEqual: Terminal('columnEqual'),
  semicolumn: Terminal('semicolumn'),
  substitute: Terminal('substitute'),
  columnRightAngle: Terminal('columnRightAngle'),
  columnRightArrow: Terminal('columnRightArrow'),
  comma: Terminal('comma'),
  comment: Terminal('comment'),
  blank: Terminal('blank'),
  notEqual: Terminal('notEqual'),
  notStrictEqual: Terminal('notStrictEqual'),
};

/** 文法中的全体非终结符号 */
export const nonTerminalSymbols: SyntaxSymbol[] = ArrayHelper.toArray(
  sbl,
).filter((sbl) => sbl.type === 'nonTerminal');

/** 文法中的全体终结符号 */
export const terminalSymbols: SyntaxSymbol[] = ArrayHelper.toArray(sbl).filter(
  (sbl) => sbl.type === 'terminal',
);

/** 全体产生式规则 */
export const allRules: ProductionRule[] = [
  {
    name: 'S -> B5',
    lhs: sbl.start,
    rhs: [sbl.b5],
  },
  {
    name: 'B6 -> B5 L',
    lhs: sbl.b6,
    rhs: [sbl.b5, sbl.l],
  },
  {
    name: 'l -> eps',
    lhs: sbl.l,
    rhs: [],
  },
  {
    name: 'l -> , b5 l',
    lhs: sbl.l,
    rhs: [sbl.comma, sbl.b5, sbl.l],
  },
  {
    name: 'b5 -> b4 assign',
    lhs: sbl.b5,
    rhs: [sbl.b4, sbl.assign],
  },

  {
    name: 'assign -> := b4 assign',
    lhs: sbl.assign,
    rhs: [sbl.columnEqual, sbl.b4, sbl.assign],
  },

  {
    name: 'assign -> == b4 assign',
    lhs: sbl.assign,
    rhs: [sbl.doubleEqual, sbl.b4, sbl.assign],
  },

  {
    name: 'assign -> eps',
    lhs: sbl.assign,
    rhs: [],
  },

  {
    name: 'b4 -> b3 sub',
    lhs: sbl.b4,
    rhs: [sbl.b3, sbl.Substitute],
  },

  {
    name: 'sub -> /. b3 sub',
    lhs: sbl.Substitute,
    rhs: [sbl.substitute, sbl.b3, sbl.Substitute],
  },
  {
    name: 'sub -> eps',
    lhs: sbl.Substitute,
    rhs: [],
  },
  {
    name: 'b3 -> b2l rule',
    lhs: sbl.b3,
    rhs: [sbl.b2l, sbl.rule],
  },
  {
    name: 'rule -> -> b2l',
    lhs: sbl.rule,
    rhs: [sbl.rightArrow, sbl.b2l],
  },
  {
    name: 'rule -> :-> b2l',
    lhs: sbl.rule,
    rhs: [sbl.columnRightArrow, sbl.b2l],
  },
  {
    name: 'rule -> eps',
    lhs: sbl.rule,
    rhs: [],
  },
  {
    name: 'b2l -> b2_not logic',
    lhs: sbl.b2l,
    rhs: [sbl.b2_not, sbl.logic],
  },
  {
    name: 'logic -> eps',
    lhs: sbl.logic,
    rhs: [],
  },
  {
    name: 'logic -> && b2_not logic',
    lhs: sbl.logic,
    rhs: [sbl.and, sbl.b2_not, sbl.logic],
  },
  {
    name: 'logic -> || b2_not logic',
    lhs: sbl.logic,
    rhs: [sbl.or, sbl.b2_not, sbl.logic],
  },
  {
    name: 'b2_not -> ! b2_not',
    lhs: sbl.b2_not,
    rhs: [sbl.exclamation, sbl.b2_not],
  },
  {
    name: 'b2_not -> b2',
    lhs: sbl.b2_not,
    rhs: [sbl.b2],
  },
  {
    name: 'b2 -> e bool',
    lhs: sbl.b2,
    rhs: [sbl.e, sbl.bool],
  },
  {
    name: 'bool -> > e bool',
    lhs: sbl.bool,
    rhs: [sbl.rightAngle, sbl.e, sbl.bool],
  },
  {
    name: 'bool -> < e bool',
    lhs: sbl.bool,
    rhs: [sbl.leftAngle, sbl.e, sbl.bool],
  },
  {
    name: 'bool -> >= e bool',
    lhs: sbl.bool,
    rhs: [sbl.rightAngleEqual, sbl.e, sbl.bool],
  },
  {
    name: 'bool -> <= e bool',
    lhs: sbl.bool,
    rhs: [sbl.leftAngleEqual, sbl.e, sbl.bool],
  },
  {
    name: 'bool -> == e bool',
    lhs: sbl.bool,
    rhs: [sbl.bool, sbl.doubleEqual, sbl.e, sbl.bool],
  },
  {
    name: 'bool -> === e bool',
    lhs: sbl.bool,
    rhs: [sbl.tripleEqual, sbl.e, sbl.bool],
  },
  {
    name: 'bool -> != e bool',
    lhs: sbl.bool,
    rhs: [sbl.notEqual, sbl.e, sbl.bool],
  },
  {
    name: 'bool -> !== e bool',
    lhs: sbl.bool,
    rhs: [sbl.notStrictEqual, sbl.e, sbl.bool],
  },
  {
    name: 'e -> t ep',
    lhs: sbl.e,
    rhs: [sbl.t, sbl.ep],
  },
];
