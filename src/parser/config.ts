import { ArrayHelper } from 'src/helpers/to-array';
import { SyntaxSymbol, ProductionRule } from './interfaces';

export const allSymbols: Record<string, SyntaxSymbol> = {
  // S
  start: {
    id: 'start',
    name: 'Start',
    description: '开始符号',
    type: 'nonTerminal',
    displayName: 'S',
    zhName: '开始',
  },

  value: {
    id: 'value',
    name: 'Value',
    description: '值符号',
    type: 'nonTerminal',
    displayName: "S'",
    zhName: '值',
  },

  cmp0: {
    id: 'cmp0',
    name: 'CMP_0',
    description: '比较层级 0',
    type: 'nonTerminal',
    displayName: 'CMP_0',
    zhName: '比较_0',
  },

  cmp1: {
    id: 'cmp1',
    name: 'CMP_1',
    description: '比较层级 1',
    type: 'nonTerminal',
    displayName: 'CMP_1',
    zhName: '比较_1',
  },

  cmp2: {
    id: 'cmp2',
    name: 'CMP_2',
    description: '比较层级 2',
    type: 'nonTerminal',
    displayName: 'CMP_2',
    zhName: '比较_2',
  },

  // str
  stringSymbol: {
    id: 'string',
    name: 'String',
    description: '字符串符号',
    type: 'terminal',
    definition: { tokenClassName: 'string' },
    displayName: 'str',
    zhName: '字符串',
  },

  // A
  array: {
    id: 'array',
    name: 'Array',
    description: '数组符号',
    type: 'nonTerminal',
    displayName: 'A',
    zhName: '数组',
  },

  // L
  list: {
    id: 'list',
    name: 'List',
    description: '列表符号',
    type: 'nonTerminal',
    displayName: 'L',
    zhName: '列表',
  },

  // L'
  listExpand: {
    id: 'listExpand',
    name: 'ListExpand',
    description: '列表第二项及以后',
    type: 'nonTerminal',
    displayName: "L'",
    zhName: '列表余项',
  },

  // E
  expression: {
    id: 'expression',
    name: 'Expression',
    description: '表达式符号',
    type: 'nonTerminal',
    displayName: 'E',
    zhName: '表达式',
  },

  // ε
  epsilon: {
    id: 'epsilon',
    name: 'Epsilon',
    description: '空符号',
    zhName: '空',
    type: 'terminal',
    displayName: 'ε',
    definition: {
      tokenClassName: '',
    },
  },

  // number
  number: {
    id: 'number',
    name: 'Number',
    description: '数值符号',
    type: 'terminal',
    displayName: 'num',
    definition: {
      tokenClassName: 'digits',
    },
    zhName: '数值',
  },

  // E'
  expressionExpand: {
    id: 'expressionExpand',
    name: 'ExpressionExpand',
    description: '表达式（辅助符号）',
    type: 'nonTerminal',
    displayName: "E'",
    zhName: '表达式余项',
  },

  // T
  term: {
    id: 'term',
    name: 'Term',
    description: '可加项符号',
    type: 'nonTerminal',
    displayName: 'T',
    zhName: '可加项',
  },

  // T'
  termExpand: {
    id: 'termExpand',
    name: 'TermExpand',
    description: '可加项余项符号（辅助符号）',
    type: 'nonTerminal',
    displayName: "T'",
    zhName: '可加项余项',
  },

  // F
  factor: {
    id: 'factor',
    name: 'Factor',
    description: '因子符号（可乘项）',
    type: 'nonTerminal',
    displayName: 'F',
    zhName: '因子',
  },

  // F'
  factorExpand: {
    id: 'factorExpand',
    name: 'FactorExpand',
    description: '因子余项符号（辅助符号）',
    type: 'nonTerminal',
    displayName: "F'",
    zhName: '因子余项',
  },

  // P
  parametersPart: {
    id: 'parametersPart',
    name: 'ParametersPart',
    description: '标识符右侧可选参数部分',
    type: 'nonTerminal',
    displayName: 'P',
    zhName: '函数参数部分',
  },

  // REM_0
  remainder: {
    id: 'rem0',
    name: 'Remainder',
    description: '余数运算',
    type: 'nonTerminal',
    displayName: 'REM_0',
    zhName: '余数运算',
  },

  // REM_1
  remainderExpand: {
    id: 'rem1',
    name: 'RemainderExpand',
    description: '余数运算余项',
    type: 'nonTerminal',
    displayName: 'REM_1',
    zhName: '余数运算余项',
  },

  // NEG
  negFactor: {
    id: 'negFactor',
    name: 'NegativeFactor',
    description: '可能为负数的项',
    type: 'nonTerminal',
    displayName: 'NEG',
    zhName: '可能为负项',
  },

  // POW_0
  powerFactor: {
    id: 'powerFactor',
    name: 'PowerFactor',
    description: '幂次项',
    type: 'nonTerminal',
    displayName: 'POW_0',
    zhName: '幂次项',
  },

  // POW_1
  powerFactorExpand: {
    id: 'powerFactorExpand',
    name: 'PowerFactorExpand',
    description: '幂次项余项',
    type: 'nonTerminal',
    displayName: 'POW_1',
    zhName: '幂次项余项',
  },

  // =
  singleEqualSign: {
    id: 'singleEqual',
    name: 'SingleEqual',
    description: '赋值符号',
    type: 'terminal',
    displayName: '=',
    definition: {
      tokenClassName: 'singleEqual',
    },
    zhName: '赋值符号',
  },

  // :=
  columnEqualSign: {
    id: 'columnEqual',
    name: 'ColumnEqual',
    description: '延迟赋值符号',
    type: 'terminal',
    displayName: ':=',
    definition: {
      tokenClassName: 'columnEqual',
    },
    zhName: '延迟赋值符号',
  },

  // '+'
  plus: {
    id: 'plus',
    name: 'Plus',
    description: '加号',
    type: 'terminal',
    displayName: '+',
    definition: {
      tokenClassName: 'plus',
    },
    zhName: '加号',
  },

  // '-'
  minus: {
    id: 'minus',
    name: 'Minus',
    description: '减号',
    type: 'terminal',
    displayName: '-',
    definition: {
      tokenClassName: 'minus',
    },
    zhName: '减号',
  },

  // '*'
  times: {
    id: 'times',
    name: 'times',
    description: '乘号',
    type: 'terminal',
    displayName: '*',
    definition: {
      tokenClassName: 'times',
    },
    zhName: '乘号',
  },

  // '/'
  divideBy: {
    id: 'divideBy',
    name: 'DivideBy',
    description: '除号',
    type: 'terminal',
    displayName: '/',
    definition: {
      tokenClassName: 'divideBy',
    },
    zhName: '除号',
  },

  // >
  greaterThan: {
    id: 'greaterThan',
    name: 'GreaterThan',
    description: '严格大于号',
    type: 'terminal',
    displayName: '>',
    definition: {
      tokenClassName: 'greaterThan',
    },
    zhName: '严格大于号',
  },

  // >=
  greaterThanOrEqualTo: {
    id: 'greaterThanOrEqualTo',
    name: 'GreaterThanOrEqualTo',
    description: '严格不小于号',
    type: 'terminal',
    displayName: '>=',
    definition: {
      tokenClassName: 'greaterThanOrEqualTo',
    },
    zhName: '严格不小于号',
  },

  // <
  lessThan: {
    id: 'lessThan',
    name: 'LessThan',
    description: '严格小于号',
    type: 'terminal',
    displayName: '<',
    definition: {
      tokenClassName: 'lessThan',
    },
    zhName: '严格小于号',
  },

  // <=
  lessThanOrEqualTo: {
    id: 'lessThanOrEqualTo',
    name: 'LessThanOrEqualTo',
    description: '严格不大于号',
    type: 'terminal',
    displayName: '<=',
    definition: {
      tokenClassName: 'lessThanOrEqualTo',
    },
    zhName: '严格不小于号',
  },

  // ==
  equalSign: {
    id: 'equalSign',
    name: 'DoubleEqual',
    description: '等于号',
    type: 'terminal',
    displayName: '==',
    definition: {
      tokenClassName: 'doubleEqual',
    },
    zhName: '双等于号',
  },

  // '('
  leftParenthesis: {
    id: 'leftParenthesis',
    name: 'LeftParenthesis',
    description: '左括号，通常用于强制运算符结合顺序。',
    type: 'terminal',
    displayName: '(',
    definition: {
      tokenClassName: 'leftParenthesis',
    },
    zhName: '左括号',
  },

  // ')'
  rightParenthesis: {
    id: 'rightParenthesis',
    name: 'RightParenthesis',
    description: '右括号，通常用于强制运算符结合顺序。',
    type: 'terminal',
    displayName: ')',
    definition: {
      tokenClassName: 'rightParenthesis',
    },
    zhName: '右括号',
  },

  // '['
  leftSquareBracket: {
    id: 'leftSquareBracket',
    name: 'LeftSquareBracket',
    description: '左方括号，通常用于表示一个函数参数列表的开始。',
    type: 'terminal',
    displayName: '[',
    definition: {
      tokenClassName: 'leftSquareBracket',
    },
    zhName: '左方括号',
  },

  // ']'
  rightSquareBracket: {
    id: 'rightSquareBracket',
    name: 'RightSquareBracket',
    description: '右方括号，通常用于表示一个函数参数列表的结束。',
    displayName: ']',
    type: 'terminal',
    definition: {
      tokenClassName: 'rightSquareBracket',
    },
    zhName: '右方括号',
  },

  // '{'
  leftBracket: {
    id: 'leftBracket',
    name: 'LeftBracket',
    description: '左花括号',
    displayName: '{',
    type: 'terminal',
    definition: {
      tokenClassName: 'leftBracket',
    },
    zhName: '左花括号',
  },

  // '}'
  rightBracket: {
    id: 'rightBracket',
    name: 'RightBracket',
    description: '右花括号',
    displayName: '}',
    type: 'terminal',
    definition: {
      tokenClassName: 'rightBracket',
    },
    zhName: '右花括号',
  },

  // id
  identifier: {
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
  },

  // ,
  comma: {
    id: 'comma',
    name: 'Comma',
    description: '逗号，可用作函数参数列表的分隔符或者数组各项的分隔符。',
    type: 'terminal',
    displayName: ',',
    definition: {
      tokenClassName: 'comma',
    },
    zhName: '逗号',
  },

  // ^
  caret: {
    id: 'caret',
    name: 'Caret',
    description: '插入符',
    type: 'terminal',
    displayName: '^',
    definition: {
      tokenClassName: 'caret',
    },
    zhName: '插入符',
  },

  // %
  percent: {
    id: 'percent',
    name: 'Percent',
    description: '百分号',
    type: 'terminal',
    displayName: '%',
    definition: {
      tokenClassName: 'percent',
    },
    zhName: '百分号',
  },

  // $
  endOfFile: {
    id: 'endOfFile',
    name: 'EndOfFile',
    description: '文件结束符，表示输入结束。',
    type: 'terminal',
    displayName: '$',
    definition: {
      tokenClassName: 'endOfFile',
    },
    zhName: '文件结束符',
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
    name: "S -> S' CMP_0",
    lhs: allSymbols.start,
    rhs: [allSymbols.value, allSymbols.cmp0],
  },

  {
    name: "CMP_0 -> == S' CMP_0",
    lhs: allSymbols.cmp0,
    rhs: [allSymbols.equalSign, allSymbols.value, allSymbols.cmp0],
  },

  {
    name: 'CMP_0 -> ε',
    lhs: allSymbols.cmp0,
    rhs: [allSymbols.epsilon],
  },

  {
    name: "S' -> E CMP_2",
    lhs: allSymbols.value,
    rhs: [allSymbols.expression, allSymbols.cmp2],
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
    name: 'CMP_2 -> > E CMP_2',
    lhs: allSymbols.cmp2,
    rhs: [allSymbols.greaterThan, allSymbols.expression, allSymbols.cmp2],
  },

  {
    name: 'CMP_2 -> < E CMP_2',
    lhs: allSymbols.cmp2,
    rhs: [allSymbols.lessThan, allSymbols.expression, allSymbols.cmp2],
  },

  {
    name: 'CMP_2 -> >= E CMP_2',
    lhs: allSymbols.cmp2,
    rhs: [
      allSymbols.greaterThanOrEqualTo,
      allSymbols.expression,
      allSymbols.cmp2,
    ],
  },

  {
    name: 'CMP_2 -> <= E CMP_2',
    lhs: allSymbols.cmp2,
    rhs: [allSymbols.lessThanOrEqualTo, allSymbols.expression, allSymbols.cmp2],
  },

  {
    name: 'CMP_2 -> ε',
    lhs: allSymbols.cmp2,
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
    name: "T -> REM_0 T'",
    lhs: allSymbols.term,
    rhs: [allSymbols.remainder, allSymbols.termExpand],
  },

  {
    name: "T' -> '*' REM_0 T'",
    lhs: allSymbols.termExpand,
    rhs: [allSymbols.times, allSymbols.remainder, allSymbols.termExpand],
  },

  {
    name: "T' -> '/' REM_0 T'",
    lhs: allSymbols.termExpand,
    rhs: [allSymbols.divideBy, allSymbols.remainder, allSymbols.termExpand],
  },

  {
    name: "T' -> ε",
    lhs: allSymbols.termExpand,
    rhs: [allSymbols.epsilon],
  },

  {
    name: 'REM_0 -> NEG REM_1',
    lhs: allSymbols.remainder,
    rhs: [allSymbols.negFactor, allSymbols.remainderExpand],
  },

  {
    name: 'REM_1 -> % NEG REM_1',
    lhs: allSymbols.remainderExpand,
    rhs: [allSymbols.percent, allSymbols.negFactor, allSymbols.remainderExpand],
  },

  {
    name: 'REM_1 -> ε',
    lhs: allSymbols.remainderExpand,
    rhs: [allSymbols.epsilon],
  },

  {
    name: 'NEG -> - POW_0',
    lhs: allSymbols.negFactor,
    rhs: [allSymbols.minus, allSymbols.powerFactor],
  },

  {
    name: 'NEG -> POW_0',
    lhs: allSymbols.negFactor,
    rhs: [allSymbols.powerFactor],
  },

  {
    name: 'POW_0 -> F POW_1',
    lhs: allSymbols.powerFactor,
    rhs: [allSymbols.factor, allSymbols.powerFactorExpand],
  },

  {
    name: 'POW_1 -> ^ F POW_1',
    lhs: allSymbols.powerFactorExpand,
    rhs: [allSymbols.caret, allSymbols.factor, allSymbols.powerFactorExpand],
  },

  {
    name: 'POW_1 -> ε',
    lhs: allSymbols.powerFactorExpand,
    rhs: [allSymbols.epsilon],
  },

  {
    name: "F -> F' P",
    lhs: allSymbols.factor,
    rhs: [allSymbols.factorExpand, allSymbols.parametersPart],
  },

  {
    name: "F' -> ( E )",
    lhs: allSymbols.factorExpand,
    rhs: [
      allSymbols.leftParenthesis,
      allSymbols.expression,
      allSymbols.rightParenthesis,
    ],
  },

  {
    name: "F' -> number",
    lhs: allSymbols.factorExpand,
    rhs: [allSymbols.number],
  },

  {
    name: "F' -> id",
    lhs: allSymbols.factorExpand,
    rhs: [allSymbols.identifier],
  },

  {
    name: "F' -> { L }",
    lhs: allSymbols.factorExpand,
    rhs: [allSymbols.leftBracket, allSymbols.list, allSymbols.rightBracket],
  },

  {
    name: "F' -> str",
    lhs: allSymbols.factorExpand,
    rhs: [allSymbols.stringSymbol],
  },

  {
    name: 'P -> [ L ] P',
    lhs: allSymbols.parametersPart,
    rhs: [
      allSymbols.leftSquareBracket,
      allSymbols.list,
      allSymbols.rightSquareBracket,
      allSymbols.parametersPart,
    ],
  },

  {
    name: 'P -> = S',
    lhs: allSymbols.parametersPart,
    rhs: [allSymbols.singleEqualSign, allSymbols.start],
  },

  {
    name: 'P -> := S',
    lhs: allSymbols.parametersPart,
    rhs: [allSymbols.columnEqualSign, allSymbols.start],
  },

  {
    name: 'P -> ε',
    lhs: allSymbols.parametersPart,
    rhs: [allSymbols.epsilon],
  },
];
