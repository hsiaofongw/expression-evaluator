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
    name: 's -> b5',
    lhs: sbl.start,
    rhs: [sbl.b5],
  },
  {
    name: 'b6 -> b5 l',
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
  {
    name: 'ep -> + t ep',
    lhs: sbl.ep,
    rhs: [sbl.plus, sbl.t, sbl.ep],
  },
  {
    name: 'ep -> - t ep',
    lhs: sbl.ep,
    rhs: [sbl.minus, sbl.t, sbl.ep],
  },
  {
    name: 'ep -> eps',
    lhs: sbl.ep,
    rhs: [],
  },
  {
    name: 't -> f3 tp',
    lhs: sbl.t,
    rhs: [sbl.f3, sbl.tp],
  },
  {
    name: 'tp -> * f3 tp',
    lhs: sbl.tp,
    rhs: [sbl.times, sbl.f3, sbl.tp],
  },
  {
    name: 'tp -> / f3 tp',
    lhs: sbl.tp,
    rhs: [sbl.divide, sbl.f3, sbl.tp],
  },
  {
    name: 'tp -> eps',
    lhs: sbl.tp,
    rhs: [],
  },
  {
    name: 'f3 -> f2 rem',
    lhs: sbl.f3,
    rhs: [sbl.f2, sbl.rem],
  },
  {
    name: 'rem -> % f2 rem',
    lhs: sbl.rem,
    rhs: [sbl.percent, sbl.f2, sbl.rem],
  },
  {
    name: 'rem -> eps',
    lhs: sbl.rem,
    rhs: [],
  },
  {
    name: 'f2 -> - f1',
    lhs: sbl.f2,
    rhs: [sbl.minus, sbl.f1],
  },
  {
    name: 'f2 -> f1',
    lhs: sbl.f2,
    rhs: [sbl.f1],
  },
  {
    name: 'f1 -> f0 pow',
    lhs: sbl.f1,
    rhs: [sbl.f0, sbl.pow],
  },
  {
    name: 'pow -> eps',
    lhs: sbl.pow,
    rhs: [],
  },
  {
    name: 'pow -> ^ f0 pow',
    lhs: sbl.pow,
    rhs: [sbl.pow, sbl.f0, sbl.pow],
  },
  {
    name: 'f0 -> f ptn',
    lhs: sbl.f0,
    rhs: [sbl.f, sbl.ptn],
  },
  {
    name: 'f0 -> _ f',
    lhs: sbl.f0,
    rhs: [sbl.singleUnderline, sbl.f, sbl.ptn],
  },
  {
    name: 'f0 -> __ f',
    lhs: sbl.f0,
    rhs: [sbl.doubleUnderline, sbl.f, sbl.ptn],
  },
  {
    name: 'f0 -> ___ f',
    lhs: sbl.f0,
    rhs: [sbl.tripleUnderline, sbl.f, sbl.ptn],
  },
  {
    name: 'ptn -> eps',
    lhs: sbl.ptn,
    rhs: [],
  },
  {
    name: 'ptn -> _ f ptn',
    lhs: sbl.ptn,
    rhs: [sbl.singleUnderline, sbl.f, sbl.ptn],
  },
  {
    name: 'ptn -> __ f ptn',
    lhs: sbl.ptn,
    rhs: [sbl.doubleUnderline, sbl.f, sbl.ptn],
  },
  {
    name: 'ptn -> ___ f ptn',
    lhs: sbl.ptn,
    rhs: [sbl.tripleUnderline, sbl.f, sbl.ptn],
  },
  {
    name: 'f -> id id_ext',
    lhs: sbl.f,
    rhs: [sbl.identifier, sbl.id_ext],
  },
  {
    name: 'id_ext -> eps',
    lhs: sbl.id_ext,
    rhs: [],
  },
  {
    name: 'id_ext -> [ params_ext',
    lhs: sbl.id_ext,
    rhs: [sbl.leftSquare, sbl.params_ext],
  },
  {
    name: 'params_ext -> l ] id_ext',
    lhs: sbl.params_ext,
    rhs: [sbl.l, sbl.rightSquare, sbl.id_ext],
  },
  {
    name: 'params_ext -> [ s ] ] id_ext',
    lhs: sbl.params_ext,
    rhs: [
      sbl.leftSquare,
      sbl.start,
      sbl.rightSquare,
      sbl.rightSquare,
      sbl.id_ext,
    ],
  },
  {
    name: 'base -> ( e )',
    lhs: sbl.base,
    rhs: [sbl.leftParentheses, sbl.e, sbl.rightParentheses],
  },
  {
    name: 'base -> Num',
    lhs: sbl.base,
    rhs: [sbl.Num],
  },
  {
    name: 'base -> { L }',
    lhs: sbl.base,
    rhs: [sbl.leftBracket, sbl.l, sbl.rightBracket],
  },
  {
    name: 'base -> <| L |>',
    lhs: sbl.base,
    rhs: [sbl.leftAngleColumn, sbl.l, sbl.columnRightAngle],
  },
  {
    name: 'base -> str',
    lhs: sbl.base,
    rhs: [sbl.string],
  },
  {
    name: 'base -> identifier',
    lhs: sbl.base,
    rhs: [sbl.identifier],
  },
  {
    name: 'Num -> num num_ext',
    lhs: sbl.Num,
    rhs: [sbl.number, sbl.num_ext],
  },
  {
    name: 'num_ext -> factorial',
    lhs: sbl.num_ext,
    rhs: [sbl.factorial],
  },
  {
    name: 'num_ext -> . num dot_ext',
    lhs: sbl.num_ext,
    rhs: [sbl.dot, sbl.number, sbl.dot_ext],
  },
  {
    name: 'dot_ext -> eps',
    lhs: sbl.dot_ext,
    rhs: [],
  },
  {
    name: 'dot_ext -> e scientific_ext',
    lhs: sbl.dot_ext,
    rhs: [sbl.e, sbl.scientific_ext],
  },
  {
    name: 'factorial -> eps',
    lhs: sbl.factorial,
    rhs: [],
  },
  {
    name: 'dfactorial -> eps',
    lhs: sbl.dfactorial,
    rhs: [],
  },
  {
    name: 'dfactorial -> !',
    lhs: sbl.dfactorial,
    rhs: [sbl.exclamation],
  },
];
