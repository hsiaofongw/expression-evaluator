/** 词素切分标识 */
export type Separator = {
  regex: RegExp;
  name: string;
};

/** 词素 */
export type Token = {
  startIndex: number;
  length: number;
  content: string;
  name: string;
};

/** 分析结果 */
export type TokenizeResult = {
  tokens: Token[];
};

export interface IMainService {
  main(): void;
}
