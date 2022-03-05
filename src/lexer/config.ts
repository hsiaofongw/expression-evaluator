import { TokenClass } from './interfaces';

export type TokenClassType =
  | 'leftParenthesis'
  | 'rightParenthesis'
  | 'plus'
  | 'minus'
  | 'times'
  | 'divideBy'
  | 'dot'
  | 'identifier'
  | 'number'
  | 'comma'
  | 'leftSquareBracket'
  | 'rightSquareBracket'
  | 'leftBracket'
  | 'rightBracket'
  | 'doubleQuote'
  | 'stringToken'
  | 'assignToken'
  | 'delayedAssignToken'
  | 'doubleEqualSign'
  | 'tripleEqualSign'
  | 'lessThanSign'
  | 'lessThanOrEqualSign'
  | 'greaterThanSign'
  | 'greaterThanOrEqualTo'
  | 'caretSign'
  | 'percentSign'
  | 'endOfLine'
  | 'endOfFile'
  | 'underline';

export const tokenClasses: Record<TokenClassType, TokenClass> = {
  leftParenthesis: {
    name: 'leftParenthesis',
    description: '左括号 (',
  },

  rightParenthesis: {
    name: 'rightParenthesis',
    description: '右括号 )',
  },

  plus: {
    name: 'plus',
    description: '加 +',
  },

  minus: {
    name: 'minus',
    description: '减 -',
  },

  times: {
    name: 'times',
    description: '乘 *',
  },

  divideBy: {
    name: 'divideBy',
    description: '除 /',
  },

  dot: {
    name: 'dot',
    description: '点 .',
  },

  identifier: {
    name: 'identifier',
    description: '标识符',
  },

  number: {
    name: 'digits',
    description: '数字',
  },

  comma: {
    name: 'comma',
    description: '逗号 ,',
  },

  leftSquareBracket: {
    name: 'leftSquareBracket',
    description: '左方括号 [',
  },

  rightSquareBracket: {
    name: 'rightSquareBracket',
    description: '右方括号 ]',
  },

  leftBracket: {
    name: 'leftBracket',
    description: '左花括号 {',
  },

  rightBracket: {
    name: 'rightBracket',
    description: '右花括号 }',
  },

  doubleQuote: {
    name: 'doubleQuote',
    description: '双引号',
  },

  stringToken: {
    name: 'string',
    description: '字符串 Token',
  },

  assignToken: {
    name: 'singleEqual',
    description: '单等于号',
  },

  delayedAssignToken: {
    name: 'columnEqual',
    description: '延迟赋值',
  },

  doubleEqualSign: {
    name: 'doubleEqual',
    description: '双等于号',
  },

  tripleEqualSign: {
    name: 'tripleEqualSign',
    description: '仨等于号',
  },

  lessThanSign: {
    name: 'lessThan',
    description: '严格小于号',
  },

  lessThanOrEqualSign: {
    name: 'lessThanOrEqualTo',
    description: '严格不大于号',
  },

  greaterThanSign: {
    name: 'greaterThan',
    description: '严格大于号',
  },

  greaterThanOrEqualTo: {
    name: 'greaterThanOrEqualTo',
    description: '严格不小于号',
  },

  caretSign: {
    name: 'caret',
    description: '插入符',
  },

  percentSign: {
    name: 'percent',
    description: '百分号',
  },

  underline: {
    name: 'underline',
    description: '下划线',
  },

  endOfLine: {
    name: 'endOfLine',
    description: '行结束符',
  },

  endOfFile: {
    name: 'endOfFile',
    description: '文件结束符',
  },
};
