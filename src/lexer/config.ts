import { TokenClass } from './interfaces';

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

const stringToken: TokenClass = {
  name: 'string',
  description: '字符串 Token',
};

const endOfLine: TokenClass = {
  name: 'endOfLine',
  description: '行结束符',
};

const endOfFile: TokenClass = {
  name: 'endOfFile',
  description: '文件结束符',
};

const nullToken: TokenClass = {
  name: 'nullToken',
  description: 'null 符号',
};

const trueToken: TokenClass = {
  name: 'true',
  description: 'true 符号',
};

const falseToken: TokenClass = {
  name: 'false',
  description: 'false 符号',
};

const columnToken: TokenClass = {
  name: 'column',
  description: '冒号',
};

export const tokenClasses = {
  number,
  comma,
  leftSquareBracket,
  rightSquareBracket,
  leftBracket,
  rightBracket,
  stringToken,
  endOfLine,
  endOfFile,
  nullToken,
  trueToken,
  falseToken,
  columnToken,
};
