/** 行 */
export type Line = string;

/** 字 */
export type CharObject = { char: string; offset: number };

/** token 类 */
export type TokenClassDefinition =
  | { type: 'regexp'; regexp: RegExp }
  | { type: 'content'; content: string }
  | { type: 'endOfLine' }
  | { type: 'endOfFile' };

export type TokenClass = {
  name: string;
  description?: string;
};

export type TypedToken = {
  offset: number;
  content: string;
  type: TokenClass;
};
