import { ArrayHelper } from 'src/helpers/to-array';
import { SyntaxSymbol, ProductionRule } from './interfaces';

// S
const start: SyntaxSymbol = {
  id: 'start',
  name: 'Start',
  description: '开始符号',
  type: 'nonTerminal',
  displayName: 'S',
  zhName: '开始',
};

// str
const stringSymbol: SyntaxSymbol = {
  id: 'string',
  name: 'String',
  description: '字符串符号',
  type: 'terminal',
  definition: { tokenClassName: 'string' },
  displayName: 'str',
  zhName: '字符串',
};

// A
const array: SyntaxSymbol = {
  id: 'array',
  name: 'Array',
  description: '数组符号',
  type: 'nonTerminal',
  displayName: 'A',
  zhName: '数组',
};

// L
const list: SyntaxSymbol = {
  id: 'list',
  name: 'List',
  description: '列表符号',
  type: 'nonTerminal',
  displayName: 'L',
  zhName: '列表',
};

// L'
const listExpand: SyntaxSymbol = {
  id: 'listExpand',
  name: 'ListExpand',
  description: '列表第二项及以后',
  type: 'nonTerminal',
  displayName: "L'",
  zhName: '列表余项',
};

// E
const expression: SyntaxSymbol = {
  id: 'expression',
  name: 'Expression',
  description: '表达式符号',
  type: 'nonTerminal',
  displayName: 'E',
  zhName: '表达式',
};

// ε
const epsilon: SyntaxSymbol = {
  id: 'epsilon',
  name: 'Epsilon',
  description: '空符号',
  zhName: '空',
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
  description: '数值符号',
  type: 'terminal',
  displayName: 'num',
  definition: {
    tokenClassName: 'digits',
  },
  zhName: '数值',
};

// E'
const expressionExpand: SyntaxSymbol = {
  id: 'expressionExpand',
  name: 'ExpressionExpand',
  description: '表达式（辅助符号）',
  type: 'nonTerminal',
  displayName: "E'",
  zhName: '表达式余项',
};

// T
const term: SyntaxSymbol = {
  id: 'term',
  name: 'Term',
  description: '可加项符号',
  type: 'nonTerminal',
  displayName: 'T',
  zhName: '可加项',
};

// T'
const termExpand: SyntaxSymbol = {
  id: 'termExpand',
  name: 'TermExpand',
  description: '可加项余项符号（辅助符号）',
  type: 'nonTerminal',
  displayName: "T'",
  zhName: '可加项余项',
};

// F
const factor: SyntaxSymbol = {
  id: 'factor',
  name: 'Factor',
  description: '因子符号（可乘项）',
  type: 'nonTerminal',
  displayName: 'F',
  zhName: '因子',
};

// F'
const factorExpand: SyntaxSymbol = {
  id: 'factorExpand',
  name: 'FactorExpand',
  description: '因子余项符号（辅助符号）',
  type: 'nonTerminal',
  displayName: "F'",
  zhName: '因子余项',
};

// P
const parametersPart: SyntaxSymbol = {
  id: 'parametersPart',
  name: 'ParametersPart',
  description: '标识符右侧可选参数部分',
  type: 'nonTerminal',
  displayName: 'P',
  zhName: '函数参数部分',
};

// P'
const parametersExpandPart: SyntaxSymbol = {
  id: 'parametersExpandPart',
  name: 'ParametersExpandPart',
  description: '标识符右侧可选赋值右值部分',
  type: 'nonTerminal',
  displayName: "P'",
  zhName: '赋值部分',
};

// '='
const singleEqualSign: SyntaxSymbol = {
  id: 'singleEqual',
  name: 'SingleEqual',
  description: '赋值符号',
  type: 'terminal',
  displayName: '=',
  definition: {
    tokenClassName: 'singleEqual',
  },
  zhName: '赋值号',
};

// '+'
const plus: SyntaxSymbol = {
  id: 'plus',
  name: 'Plus',
  description: '加号',
  type: 'terminal',
  displayName: '+',
  definition: {
    tokenClassName: 'plus',
  },
  zhName: '加号',
};

// '-'
const minus: SyntaxSymbol = {
  id: 'minus',
  name: 'Minus',
  description: '减号',
  type: 'terminal',
  displayName: '-',
  definition: {
    tokenClassName: 'minus',
  },
  zhName: '减号',
};

// '*'
const times: SyntaxSymbol = {
  id: 'times',
  name: 'times',
  description: '乘号',
  type: 'terminal',
  displayName: '*',
  definition: {
    tokenClassName: 'times',
  },
  zhName: '乘号',
};

// '/'
const divideBy: SyntaxSymbol = {
  id: 'divideBy',
  name: 'DivideBy',
  description: '除号',
  type: 'terminal',
  displayName: '/',
  definition: {
    tokenClassName: 'divideBy',
  },
  zhName: '除号',
};

// '('
const leftParenthesis: SyntaxSymbol = {
  id: 'leftParenthesis',
  name: 'LeftParenthesis',
  description: '左括号，通常用于强制运算符结合顺序。',
  type: 'terminal',
  displayName: '(',
  definition: {
    tokenClassName: 'leftParenthesis',
  },
  zhName: '左括号',
};

// ')'
const rightParenthesis: SyntaxSymbol = {
  id: 'rightParenthesis',
  name: 'RightParenthesis',
  description: '右括号，通常用于强制运算符结合顺序。',
  type: 'terminal',
  displayName: ')',
  definition: {
    tokenClassName: 'rightParenthesis',
  },
  zhName: '右括号',
};

// '['
const leftSquareBracket: SyntaxSymbol = {
  id: 'leftSquareBracket',
  name: 'LeftSquareBracket',
  description: '左方括号，通常用于表示一个函数参数列表的开始。',
  type: 'terminal',
  displayName: '[',
  definition: {
    tokenClassName: 'leftSquareBracket',
  },
  zhName: '左方括号',
};

// ']'
const rightSquareBracket: SyntaxSymbol = {
  id: 'rightSquareBracket',
  name: 'RightSquareBracket',
  description: '右方括号，通常用于表示一个函数参数列表的结束。',
  displayName: ']',
  type: 'terminal',
  definition: {
    tokenClassName: 'rightSquareBracket',
  },
  zhName: '右方括号',
};

// '{'
const leftBracket: SyntaxSymbol = {
  id: 'leftBracket',
  name: 'LeftBracket',
  description: '左花括号',
  displayName: '{',
  type: 'terminal',
  definition: {
    tokenClassName: 'leftBracket',
  },
  zhName: '左花括号',
};

// '}'
const rightBracket: SyntaxSymbol = {
  id: 'rightBracket',
  name: 'RightBracket',
  description: '右花括号',
  displayName: '}',
  type: 'terminal',
  definition: {
    tokenClassName: 'rightBracket',
  },
  zhName: '右花括号',
};

// id
const identifier: SyntaxSymbol = {
  id: 'identifier',
  name: 'Identifier',
  description:
    '标识符，一般也就是变量名，通常是以下划线或者字母打头，然后后续可能紧接着 0 个或多个字母、数字以及下划线。',
  type: 'terminal',
  displayName: 'id',
  definition: {
    tokenClassName: 'identifier',
  },
  zhName: '标识符',
};

// comma
const comma: SyntaxSymbol = {
  id: 'comma',
  name: 'Comma',
  description: '逗号，可用作函数参数列表的分隔符或者数组各项的分隔符。',
  type: 'terminal',
  displayName: ',',
  definition: {
    tokenClassName: 'comma',
  },
  zhName: '逗号',
};

// $
const endOfFile: SyntaxSymbol = {
  id: 'endOfFile',
  name: 'EndOfFile',
  description: '文件结束符，表示输入结束。',
  type: 'terminal',
  displayName: '$',
  definition: {
    tokenClassName: 'endOfFile',
  },
  zhName: '文件结束符',
};

/** 所有符号 */
export const allSymbols = {
  start,

  array,
  stringSymbol,

  list,
  listExpand,

  expression,
  expressionExpand,

  term,
  termExpand,

  factor,
  factorExpand,

  parametersPart,
  parametersExpandPart,

  plus,
  minus,
  times,
  divideBy,
  singleEqualSign,

  leftParenthesis,
  rightParenthesis,
  leftSquareBracket,
  rightSquareBracket,
  leftBracket,
  rightBracket,

  number,
  identifier,
  comma,
  epsilon,
  endOfFile,
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
    name: 'S -> A',
    lhs: allSymbols.start,
    rhs: [allSymbols.array],
  },

  {
    name: 'S -> E',
    lhs: allSymbols.start,
    rhs: [allSymbols.expression],
  },

  {
    name: 'S -> str',
    lhs: allSymbols.start,
    rhs: [allSymbols.stringSymbol],
  },

  {
    name: 'A -> { L }',
    lhs: allSymbols.array,
    rhs: [allSymbols.leftBracket, allSymbols.list, allSymbols.rightBracket],
  },

  {
    name: "L -> S L'",
    lhs: allSymbols.list,
    rhs: [allSymbols.start, allSymbols.listExpand],
  },

  {
    name: 'L -> ε',
    lhs: allSymbols.list,
    rhs: [allSymbols.epsilon],
  },

  {
    name: "L' -> , S L'",
    lhs: allSymbols.listExpand,
    rhs: [allSymbols.comma, allSymbols.start, allSymbols.listExpand],
  },

  {
    name: "L' -> ε",
    lhs: allSymbols.listExpand,
    rhs: [allSymbols.epsilon],
  },

  {
    name: "E -> T E'",
    lhs: allSymbols.expression,
    rhs: [allSymbols.term, allSymbols.expressionExpand],
  },

  {
    name: "E' -> '+' T E'",
    lhs: allSymbols.expressionExpand,
    rhs: [allSymbols.plus, allSymbols.term, allSymbols.expressionExpand],
  },

  {
    name: "E' -> '-' T E'",
    lhs: allSymbols.expressionExpand,
    rhs: [allSymbols.minus, allSymbols.term, allSymbols.expressionExpand],
  },

  {
    name: "E' -> ε",
    lhs: allSymbols.expressionExpand,
    rhs: [allSymbols.epsilon],
  },

  {
    name: "T -> F T'",
    lhs: allSymbols.term,
    rhs: [allSymbols.factor, allSymbols.termExpand],
  },

  {
    name: "T' -> '*' F T'",
    lhs: allSymbols.termExpand,
    rhs: [allSymbols.times, allSymbols.factor, allSymbols.termExpand],
  },

  {
    name: "T' -> '/' F T'",
    lhs: allSymbols.termExpand,
    rhs: [allSymbols.divideBy, allSymbols.factor, allSymbols.termExpand],
  },

  {
    name: "T' -> ε",
    lhs: allSymbols.termExpand,
    rhs: [allSymbols.epsilon],
  },

  {
    name: "F -> '(' E ')'",
    lhs: allSymbols.factor,
    rhs: [
      allSymbols.leftParenthesis,
      allSymbols.expression,
      allSymbols.rightParenthesis,
    ],
  },

  {
    name: 'F -> number',
    lhs: allSymbols.factor,
    rhs: [allSymbols.number],
  },

  {
    name: 'F -> id P',
    lhs: allSymbols.factor,
    rhs: [allSymbols.identifier, allSymbols.parametersPart],
  },

  {
    name: "P -> [ L ] P'",
    lhs: allSymbols.parametersPart,
    rhs: [
      allSymbols.leftSquareBracket,
      allSymbols.list,
      allSymbols.rightSquareBracket,
      allSymbols.parametersExpandPart,
    ],
  },

  {
    name: 'P -> = S',
    lhs: allSymbols.parametersPart,
    rhs: [allSymbols.singleEqualSign, allSymbols.start],
  },

  {
    name: 'P -> ε',
    lhs: allSymbols.parametersPart,
    rhs: [allSymbols.epsilon],
  },

  {
    name: "P' -> = S",
    lhs: allSymbols.parametersExpandPart,
    rhs: [allSymbols.singleEqualSign, allSymbols.start],
  },

  {
    name: "P' -> ε",
    lhs: allSymbols.parametersExpandPart,
    rhs: [allSymbols.epsilon],
  },
];
