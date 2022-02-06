import { TokenClass } from './interfaces';

const leftParenthesis: TokenClass = {
  name: 'leftParenthesis',
  description: '左括号 (',
};

const rightParenthesis: TokenClass = {
  name: 'rightParenthesis',
  description: '右括号 )',
};

const plus: TokenClass = {
  name: 'plus',
  description: '加 +',
};

const minus: TokenClass = {
  name: 'minus',
  description: '减 -',
};

const times: TokenClass = {
  name: 'times',
  description: '乘 *',
};

const divideBy: TokenClass = {
  name: 'divideBy',
  description: '除 /',
};

const dot: TokenClass = {
  name: 'dot',
  description: '点 .',
};

const identifier: TokenClass = {
  name: 'identifier',
  description: '标识符',
};

const number: TokenClass = {
  name: 'digits',
  description: '数字',
};

const comma: TokenClass = {
  name: 'comma',
  description: '逗号 ,',
};

const leftSquareBracket: TokenClass = {
  name: 'leftSquareBracket',
  description: '左方括号 [',
};

const rightSquareBracket: TokenClass = {
  name: 'rightSquareBracket',
  description: '右方括号 ]',
};

const leftBracket: TokenClass = {
  name: 'leftBracket',
  description: '左花括号 {',
};

const rightBracket: TokenClass = {
  name: 'rightBracket',
  description: '右花括号 }',
};

const doubleQuote: TokenClass = {
  name: 'doubleQuote',
  description: '双引号',
};

const stringToken: TokenClass = {
  name: 'string',
  description: '字符串 Token',
};

const assignToken: TokenClass = {
  name: 'singleEqual',
  description: '单等于号',
};

const doubleEqualSign: TokenClass = {
  name: 'doubleEqual',
  description: '双等于号',
};

const tripleEqualSign: TokenClass = {
  name: 'tripleEqualSign',
  description: '仨等于号',
};

const lessThanSign: TokenClass = {
  name: 'lessThan',
  description: '严格小于号',
};

const lessThanOrEqualSign: TokenClass = {
  name: 'lessThanOrEqualTo',
  description: '严格不大于号',
};

const greaterThanSign: TokenClass = {
  name: 'greaterThan',
  description: '严格大于号',
};

const greaterThanOrEqualTo: TokenClass = {
  name: 'greaterThanOrEqualTo',
  description: '严格不小于号',
};

const endOfLine: TokenClass = {
  name: 'endOfLine',
  description: '行结束符',
};

const endOfFile: TokenClass = {
  name: 'endOfFile',
  description: '文件结束符',
};

export const tokenClasses = {
  plus,
  minus,
  times,
  divideBy,
  lessThanSign,
  lessThanOrEqualSign,
  greaterThanSign,
  greaterThanOrEqualTo,
  doubleEqualSign,
  dot,
  identifier,
  number,
  comma,
  leftParenthesis,
  rightParenthesis,
  leftSquareBracket,
  rightSquareBracket,
  leftBracket,
  rightBracket,
  doubleQuote,
  stringToken,
  assignToken,
  tripleEqualSign,
  endOfLine,
  endOfFile,
};
