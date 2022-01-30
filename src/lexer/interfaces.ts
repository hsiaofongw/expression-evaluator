/** 行 */
export type Line = string;

/** 字 */
export type Char = string;

/** 加了索引的字 */
export type IndexedChar = { char: Char; index: number };

/** 字符类目表条目 */
export type CharClass = {
  /** 字符类目标识符 */
  id: string;

  /** 正则表达式 */
  regexp: RegExp;

  /** 字符类目描述 */
  description?: string;

  /** 例子 */
  example?: string;
};

/** 加了类型的字 */
export type TypedChar = IndexedChar & { type: CharClass };

/** token 类 */
export type TokenClass = {
  name: string;
  description?: string;
};

/**
 * token
 *
 * token is just a list of chars
 */
export type Token = {
  offset: number;
  chars: TypedChar[];
  content: string;
};

export type TypedToken = Token & { type: TokenClass };

/** 状态 */
export type IState = {
  /** 状态标识符 */
  stateIdentifier: string;

  /** 状态描述 */
  stateDescription?: string;
};

/** 状态转移表 */
export type StateTransition = {
  current: IState;
  input: CharClass;
  next: IState;
  action?: (context: ITokenizeContext, inputChar: TypedChar) => void;
  comment?: string;
};

export interface ITokenizeContext {
  _pushChar(char: TypedChar): void;

  _popToken(): void;
}
