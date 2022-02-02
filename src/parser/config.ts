import { SyntaxSymbol, ProductionRule } from './interfaces';

// E
const expression: SyntaxSymbol = {
  id: 'expression',
  name: 'Expression',
  description: '表达式',
  type: 'nonTerminal',
  displayName: 'E',
};

// ε
const epsilon: SyntaxSymbol = {
  id: 'epsilon',
  name: 'Epsilon',
  description: '空符号',
  type: 'terminal',
  displayName: 'ε',
  definition: {
    tokenClassName: '',
  },
};

// number
const number: SyntaxSymbol = {
  id: 'number',
  name: 'Number',
  description: '数字',
  type: 'terminal',
  displayName: 'number',
  definition: {
    tokenClassName: 'digits',
  },
};

// E'
const expressionExpand: SyntaxSymbol = {
  id: 'expressionExpand',
  name: 'ExpressionExpand',
  description: '表达式（辅助符号）',
  type: 'nonTerminal',
  displayName: "E'",
  expandSymbol: true,
};

// T
const term: SyntaxSymbol = {
  id: 'term',
  name: 'Term',
  description: '项',
  type: 'nonTerminal',
  displayName: 'T',
};

// T'
const termExpand: SyntaxSymbol = {
  id: 'termExpand',
  name: 'TermExpand',
  description: '项（辅助符号）',
  type: 'nonTerminal',
  displayName: "T'",
  expandSymbol: true,
};

// F
const factor: SyntaxSymbol = {
  id: 'factor',
  name: 'Factor',
  description: '因子',
  type: 'nonTerminal',
  displayName: 'F',
};

// '+'
const plus: SyntaxSymbol = {
  id: 'plus',
  name: 'Plus',
  description: '加号',
  type: 'terminal',
  displayName: "'+'",
  definition: {
    tokenClassName: 'plus',
  },
};

// '-'
const minus: SyntaxSymbol = {
  id: 'minus',
  name: 'Minus',
  description: '减号',
  type: 'terminal',
  displayName: "'-'",
  definition: {
    tokenClassName: 'minus',
  },
};

// '*'
const times: SyntaxSymbol = {
  id: 'times',
  name: 'times',
  description: '乘号',
  type: 'terminal',
  displayName: "'*'",
  definition: {
    tokenClassName: 'times',
  },
};

// '/'
const divideBy: SyntaxSymbol = {
  id: 'divideBy',
  name: 'DivideBy',
  description: '除号',
  type: 'terminal',
  displayName: "'/'",
  definition: {
    tokenClassName: 'divideBy',
  },
};

// '('
const leftParenthesis: SyntaxSymbol = {
  id: 'leftParenthesis',
  name: 'LeftParenthesis',
  description: '左括号',
  type: 'terminal',
  displayName: "'('",
  definition: {
    tokenClassName: 'leftParenthesis',
  },
};

// ')'
const rightParenthesis: SyntaxSymbol = {
  id: 'rightParenthesis',
  name: 'RightParenthesis',
  description: '右括号',
  type: 'terminal',
  displayName: "')'",
  definition: {
    tokenClassName: 'rightParenthesis',
  },
};

// $
const endOfFile: SyntaxSymbol = {
  id: 'endOfFile',
  name: 'EndOfFile',
  description: '文件结束符',
  type: 'terminal',
  displayName: '$',
  definition: {
    tokenClassName: 'endOfFile',
  },
};

export const allSymbols = {
  expression,
  expressionExpand,
  term,
  termExpand,
  factor,
  plus,
  minus,
  times,
  divideBy,
  leftParenthesis,
  rightParenthesis,
  epsilon,
  number,
  endOfFile,
};

export const allRules: ProductionRule[] = [
  // E -> T E'
  {
    name: "E -> T E'",
    lhs: allSymbols.expression,
    rhs: [allSymbols.term, allSymbols.expressionExpand],
  },

  // E' -> '+' T E'
  {
    name: "E' -> '+' T E'",
    lhs: allSymbols.expressionExpand,
    rhs: [allSymbols.plus, allSymbols.term, allSymbols.expressionExpand],
  },

  // E' -> '-' T E'
  {
    name: "E' -> '-' T E'",
    lhs: allSymbols.expressionExpand,
    rhs: [allSymbols.minus, allSymbols.term, allSymbols.expressionExpand],
  },

  // E' -> ε
  {
    name: "E' -> ε",
    lhs: allSymbols.expressionExpand,
    rhs: [allSymbols.epsilon],
  },

  // T -> F T'
  {
    name: "T -> F T'",
    lhs: allSymbols.term,
    rhs: [allSymbols.factor, allSymbols.termExpand],
  },

  // T' -> '*' F T'
  {
    name: "T' -> '*' F T'",
    lhs: allSymbols.termExpand,
    rhs: [allSymbols.times, allSymbols.factor, allSymbols.termExpand],
  },

  // T' -> '/' F T'
  {
    name: "T' -> '/' F T'",
    lhs: allSymbols.termExpand,
    rhs: [allSymbols.divideBy, allSymbols.factor, allSymbols.termExpand],
  },

  // T' -> ε
  {
    name: "T' -> ε",
    lhs: allSymbols.termExpand,
    rhs: [allSymbols.epsilon],
  },

  // F -> '(' E ')'
  {
    name: "F -> '(' E ')'",
    lhs: allSymbols.factor,
    rhs: [
      allSymbols.leftParenthesis,
      allSymbols.expression,
      allSymbols.rightParenthesis,
    ],
  },

  // F -> number
  {
    name: 'F -> number',
    lhs: allSymbols.factor,
    rhs: [allSymbols.number],
  },
];
