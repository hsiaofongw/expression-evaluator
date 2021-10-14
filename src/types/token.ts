/** 词素切分标识 */
export type Separator = {
  regex: RegExp;
  name: string;
};

/** 词素 */
export type IToken = {
  startIndex: number;
  length: number;
  content: string;
  name: string;
};

/** 分析结果 */
export type TokenizeResult = {
  tokenGroup: TokenGroup;
};

export interface IMainService {
  main(): void;
}

/** 词组 */
export type ITokenGroup = {
  tokens: IToken[];
};

/** 一个词组 */
export class TokenGroup implements ITokenGroup {
  get totalLength(): number {
    return this.tokens
      .map((token) => token.content)
      .map((content) => content.length)
      .reduce((lenA, lenB) => lenA + lenB);
  }

  get tokensCount(): number {
    return this.tokens.length;
  }

  public readonly tokens: IToken[];

  constructor(tokens: IToken[]) {
    this.tokens = tokens;
  }

  public static createFromTokens(tokens: IToken[]) {
    return new TokenGroup(tokens);
  }

  public selectSubGroup(cond: (token: IToken) => boolean): TokenGroup {
    return TokenGroup.createFromTokens(
      this.tokens.filter((token) => cond(token)),
    );
  }
}
