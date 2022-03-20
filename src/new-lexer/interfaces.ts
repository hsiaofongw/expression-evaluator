export type TokenType =
  | CommaLikeTokenType
  | ColumnLikeTokenType
  | EqualLikeTokenType
  | DivideLikeTokenType
  | MinusLikeTokenType
  | AndLikeTokenType
  | OrLikeTokenType
  | ExclamationLikeTokenType
  | RightAngleLikeTokenType
  | LeftAngleLikeTokenType
  | PlusLikeTokenType
  | TimesLikeTokenType
  | PercentLikeTokenType
  | PowerLikeTokenType
  | SemiColumnLikeTokenType
  | DotLikeToken
  | UnderlineLikeTokenType
  | ParenthesesLikeTokenType
  | RightParenthesesLikeTokenType
  | LeftBracketLikeTokenType
  | RightBracketLikeTokenType
  | StringLikeTokenType
  | NumberLikeTokenType
  | LeftSquareLikeTokenType
  | RightSquareLikeTokenType
  | IdentifierLikeTokenType
  | BlankLikeTokenType;

export type CommaLikeTokenType = 'comma';
export type ColumnLikeTokenType = 'columnEqual' | 'columnRightArrow';
export type EqualLikeTokenType = 'equal' | 'doubleEqual' | 'tripleEqual';
export type DivideLikeTokenType = 'divide' | 'substitute';
export type MinusLikeTokenType = 'minus' | 'rightArrow';
export type AndLikeTokenType = 'and';
export type OrLikeTokenType = 'or' | 'columnRightAngle';
export type ExclamationLikeTokenType =
  | 'exclamation'
  | 'notEqual'
  | 'notStrictEqual';
export type RightAngleLikeTokenType = 'rightAngle' | 'rightAngleEqual';
export type LeftAngleLikeTokenType =
  | 'leftAngle'
  | 'leftAngleColumn'
  | 'leftAngleEqual';
export type PlusLikeTokenType = 'plus' | 'doublePlus';
export type TimesLikeTokenType = 'times';
export type PercentLikeTokenType = 'percent';
export type PowerLikeTokenType = 'power';
export type SemiColumnLikeTokenType = 'semicolumn';
export type DotLikeToken = 'dot';
export type UnderlineLikeTokenType =
  | 'singleUnderline'
  | 'doubleUnderline'
  | 'tripleUnderline';
export type ParenthesesLikeTokenType = 'leftParentheses' | 'comment';
export type RightParenthesesLikeTokenType = 'rightParentheses';
export type LeftBracketLikeTokenType = 'leftBracket';
export type RightBracketLikeTokenType = 'rightBracket';
export type StringLikeTokenType = 'string';
export type NumberLikeTokenType = 'number';
export type LeftSquareLikeTokenType = 'leftSquare';
export type RightSquareLikeTokenType = 'rightSquare';
export type IdentifierLikeTokenType = 'identifier';
export type BlankLikeTokenType = 'blank';

export type MatchResult = { content: string; tokenClassName: TokenType };
export type Token = MatchResult;

export type MatchFunction = (
  lookAhead: string,
  moreCharCallback: () => void,
  emit: (token: MatchResult) => void,
  setNextState: (nextState: MatchFunction) => void,
) => void;

export type MatchFunctionDescriptor =
  | LL1MatchFunctionDescriptor
  | PatternMatchFunctionDescriptor
  | DefaultMatchFunctionDescriptor;

export type BasicMatchFunctionDescriptor = {
  name?: string;
  matchFunction: MatchFunction;
};

export type LL1MatchFunctionDescriptor = {
  type: 'll1';
  lookAhead: string;
} & BasicMatchFunctionDescriptor;

export type PatternMatchFunctionDescriptor = {
  type: 'pattern';
  pattern: RegExp;
} & BasicMatchFunctionDescriptor;

export type DefaultMatchFunctionDescriptor = {
  type: 'default';
} & BasicMatchFunctionDescriptor;
