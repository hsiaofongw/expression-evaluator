import { ArrayHelper } from 'src/helpers/to-array';
import { SyntaxSymbol, ProductionRule } from './interfaces';

const json: SyntaxSymbol = {
  id: 'json',
  name: 'JSON',
  description: 'JSON, 开始符号',
  type: 'nonTerminal',
  displayName: 'JSON',
  zhName: 'JSON',
};

const obj: SyntaxSymbol = {
  id: 'obj',
  name: 'Object',
  description: '对象',
  type: 'nonTerminal',
  displayName: 'OBJ',
  zhName: '对象',
};

const ary: SyntaxSymbol = {
  id: 'ary',
  name: '数组',
  description: '数组',
  type: 'nonTerminal',
  displayName: 'ARY',
  zhName: '数组',
};

const val: SyntaxSymbol = {
  id: 'val',
  name: 'Value',
  description: '值',
  type: 'nonTerminal',
  displayName: 'VAL',
  zhName: '值',
};

const atom: SyntaxSymbol = {
  id: 'atom',
  name: 'Atom',
  description: '原子值',
  type: 'nonTerminal',
  displayName: 'ATOM',
  zhName: '原子值',
};

const valList: SyntaxSymbol = {
  id: 'valList',
  name: 'ValueList',
  description: '值列表',
  type: 'nonTerminal',
  displayName: 'ATOM',
  zhName: '值列表',
};

const valListE: SyntaxSymbol = {
  id: 'valListE',
  name: 'ValueListExtend',
  description: '值列表余项',
  type: 'nonTerminal',
  displayName: 'VAL_LIST_E',
  zhName: '值列表余项',
};

const kv: SyntaxSymbol = {
  id: 'kv',
  name: 'KeyValuePair',
  description: '键值对',
  type: 'nonTerminal',
  displayName: 'KV',
  zhName: '键值对',
};

const kvList: SyntaxSymbol = {
  id: 'kvList',
  name: 'KeyValuePairList',
  description: '键值对列表',
  type: 'nonTerminal',
  displayName: 'KV_LIST',
  zhName: '键值对列表',
};

const kvListE: SyntaxSymbol = {
  id: 'kvListE',
  name: 'KeyValuePairListExtend',
  description: '键值对列表余项',
  type: 'nonTerminal',
  displayName: 'KV_LIST_E',
  zhName: '键值对列表余项',
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

// true
const trueSymbol: SyntaxSymbol = {
  id: 'trueSymbol',
  name: 'True',
  description: 'True token',
  type: 'terminal',
  definition: { tokenClassName: 'true' },
  displayName: 'true',
  zhName: '真',
};

// false
const falseSymbol: SyntaxSymbol = {
  id: 'falseSymbol',
  name: 'False',
  description: 'False token',
  type: 'terminal',
  definition: { tokenClassName: 'false' },
  displayName: 'false',
  zhName: '假',
};

// boolean
const booleanSymbol: SyntaxSymbol = {
  id: 'booleanSymbol',
  name: 'Boolean',
  description: 'Boolean Symbol',
  type: 'nonTerminal',
  displayName: 'BOOL',
  zhName: '布尔值',
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

// null
const nullSymbol: SyntaxSymbol = {
  id: 'null',
  name: 'Null',
  description: 'Null 符号',
  type: 'terminal',
  displayName: 'null',
  definition: {
    tokenClassName: 'nullToken',
  },
  zhName: 'null',
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

// ,
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

// :
const column: SyntaxSymbol = {
  id: 'column',
  name: 'Column',
  description: '冒号',
  type: 'terminal',
  displayName: ':',
  definition: {
    tokenClassName: 'column',
  },
  zhName: '冒号',
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
  json,
  obj,
  ary,
  val,
  atom,
  valList,
  valListE,
  kv,
  kvList,
  kvListE,
  stringSymbol,
  leftSquareBracket,
  rightSquareBracket,
  leftBracket,
  rightBracket,
  number,
  comma,
  epsilon,
  endOfFile,
  trueSymbol,
  falseSymbol,
  booleanSymbol,
  column,
  nullSymbol,
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
    name: 'JSON -> OBJ',
    lhs: allSymbols.json,
    rhs: [allSymbols.obj],
  },
  {
    name: 'OBJ -> { KV_LIST }',
    lhs: allSymbols.obj,
    rhs: [allSymbols.leftBracket, allSymbols.kvList, allSymbols.rightBracket],
  },
  {
    name: 'JSON -> ARY',
    lhs: allSymbols.json,
    rhs: [allSymbols.ary],
  },
  {
    name: 'ARY -> [ VAL_LIST ]',
    lhs: allSymbols.ary,
    rhs: [
      allSymbols.leftSquareBracket,
      allSymbols.valList,
      allSymbols.rightSquareBracket,
    ],
  },
  {
    name: 'VAL -> ATOM',
    lhs: allSymbols.val,
    rhs: [allSymbols.atom],
  },
  {
    name: 'VAL -> JSON',
    lhs: allSymbols.val,
    rhs: [allSymbols.json],
  },
  {
    name: 'ATOM -> str',
    lhs: allSymbols.atom,
    rhs: [allSymbols.stringSymbol],
  },
  {
    name: 'ATOM -> BOOL',
    lhs: allSymbols.atom,
    rhs: [allSymbols.booleanSymbol],
  },
  {
    name: 'ATOM -> num',
    lhs: allSymbols.atom,
    rhs: [allSymbols.number],
  },
  {
    name: 'ATOM -> null',
    lhs: allSymbols.atom,
    rhs: [allSymbols.nullSymbol],
  },
  {
    name: 'VAL_LIST -> VAL VAL_LIST_E',
    lhs: allSymbols.valList,
    rhs: [allSymbols.val, allSymbols.valListE],
  },
  {
    name: 'VAL_LIST -> eps',
    lhs: allSymbols.valList,
    rhs: [allSymbols.epsilon],
  },
  {
    name: 'VAL_LIST_E -> , VAL VAL_LIST_E',
    lhs: allSymbols.valListE,
    rhs: [allSymbols.comma, allSymbols.val, allSymbols.valListE],
  },
  {
    name: 'VAL_LIST_E -> eps',
    lhs: allSymbols.valListE,
    rhs: [allSymbols.epsilon],
  },
  {
    name: 'KV -> str : VAL',
    lhs: allSymbols.kv,
    rhs: [allSymbols.stringSymbol, allSymbols.column, allSymbols.val],
  },
  {
    name: 'KV_LIST -> KV KV_LIST_E',
    lhs: allSymbols.kvList,
    rhs: [allSymbols.kv, allSymbols.kvListE],
  },
  {
    name: 'KV_LIST -> eps',
    lhs: allSymbols.kvList,
    rhs: [allSymbols.epsilon],
  },
  {
    name: 'KV_LIST_E -> , KV KV_LIST_E',
    lhs: allSymbols.kvListE,
    rhs: [allSymbols.comma, allSymbols.kv, allSymbols.kvListE],
  },
  {
    name: 'KV_LIST_E -> eps',
    lhs: allSymbols.kvListE,
    rhs: [allSymbols.epsilon],
  },
  {
    name: 'BOOL -> true',
    lhs: allSymbols.booleanSymbol,
    rhs: [allSymbols.trueSymbol],
  },
  {
    name: 'BOOL -> false',
    lhs: allSymbols.booleanSymbol,
    rhs: [allSymbols.falseSymbol],
  },
];
