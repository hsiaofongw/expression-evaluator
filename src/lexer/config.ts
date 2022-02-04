import { TokenClass } from './interfaces';

const leftParenthesis: TokenClass = {
  name: 'leftParenthesis',
  definition: {
    type: 'content',
    content: '(',
  },
  description: '左括号 (',
};

const rightParenthesis: TokenClass = {
  name: 'rightParenthesis',
  definition: {
    type: 'content',
    content: ')',
  },
  description: '右括号 )',
};

const plus: TokenClass = {
  name: 'plus',
  definition: {
    type: 'content',
    content: '+',
  },
  description: '加 +',
};

const minus: TokenClass = {
  name: 'minus',
  definition: {
    type: 'content',
    content: '-',
  },
  description: '减 -',
};

const times: TokenClass = {
  name: 'times',
  definition: {
    type: 'content',
    content: '*',
  },
  description: '乘 *',
};

const divideBy: TokenClass = {
  name: 'divideBy',
  definition: {
    type: 'content',
    content: '/',
  },
  description: '除 /',
};

const dot: TokenClass = {
  name: 'dot',
  definition: {
    type: 'content',
    content: '.',
  },
  description: '点 .',
};

const identifier: TokenClass = {
  name: 'identifier',
  definition: {
    type: 'regexp',
    regexp: /[a-zA-Z_]+[a-zA-Z_\d]*/,
  },
  description: '标识符',
};

const number: TokenClass = {
  name: 'digits',
  definition: {
    type: 'regexp',
    regexp: /\d*\.?\d*/,
  },
  description: '数字',
};

const comma: TokenClass = {
  name: 'comma',
  definition: {
    type: 'content',
    content: ',',
  },
  description: '逗号 ,',
};

const leftSquareBracket: TokenClass = {
  name: 'leftSquareBracket',
  definition: {
    type: 'content',
    content: '[',
  },
  description: '左方括号 [',
};

const rightSquareBracket: TokenClass = {
  name: 'rightSquareBracket',
  definition: {
    type: 'content',
    content: ']',
  },
  description: '右方括号 ]',
};

const endOfLine: TokenClass = {
  name: 'endOfLine',
  definition: {
    type: 'endOfLine',
  },
  description: '行结束符',
};

const endOfFile: TokenClass = {
  name: 'endOfFile',
  definition: {
    type: 'endOfFile',
  },
  description: '文件结束符',
};

export const tokenClasses = {
  leftParenthesis,
  rightParenthesis,
  plus,
  minus,
  times,
  divideBy,
  dot,
  identifier,
  number,
  comma,
  leftSquareBracket,
  rightSquareBracket,
  endOfLine,
  endOfFile,
};
