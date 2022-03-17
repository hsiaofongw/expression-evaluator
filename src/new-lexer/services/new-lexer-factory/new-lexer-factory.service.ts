/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { Subject, Subscription } from 'rxjs';
import { Transform, TransformCallback } from 'stream';

type TokenType =
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

type CommaLikeTokenType = 'comma';
type ColumnLikeTokenType = 'columnEqual' | 'columnRightArrow';
type EqualLikeTokenType = 'equal' | 'doubleEqual' | 'tripleEqual';
type DivideLikeTokenType = 'divide' | 'substitute';
type MinusLikeTokenType = 'minus' | 'rightArrow';
type AndLikeTokenType = 'and';
type OrLikeTokenType = 'or';
type ExclamationLikeTokenType = 'exclamation' | 'notEqual' | 'notStrictEqual';
type RightAngleLikeTokenType = 'rightAngle' | 'rightAngleEqual';
type LeftAngleLikeTokenType = 'leftAngle' | 'leftAngleEqual';
type PlusLikeTokenType = 'plus' | 'doublePlus';
type TimesLikeTokenType = 'times';
type PercentLikeTokenType = 'percent';
type PowerLikeTokenType = 'power';
type UnderlineLikeTokenType =
  | 'singleUnderline'
  | 'doubleUnderline'
  | 'tripleUnderline';
type ParenthesesLikeTokenType = 'leftParentheses' | 'comment';
type RightParenthesesLikeTokenType = 'rightParentheses';
type LeftBracketLikeTokenType = 'leftBracket';
type RightBracketLikeTokenType = 'rightBracket';
type StringLikeTokenType = 'string';
type NumberLikeTokenType = 'number';
type LeftSquareLikeTokenType = 'leftSquare';
type RightSquareLikeTokenType = 'rightSquare';
type IdentifierLikeTokenType = 'identifier';
type BlankLikeTokenType = 'blank';

type MatchResult = { content: string; tokenClassName: TokenType };
type MatchFunction = () => boolean;
type MatchFunctionDescriptor =
  | LL1MatchFunctionDescriptor
  | PatternMatchFunctionDescriptor;
type BasicMatchFunctionDescriptor = {
  name: string;
  matchFunction: MatchFunction;
};
type LL1MatchFunctionDescriptor = {
  type: 'll1';
  lookAhead: string;
} & BasicMatchFunctionDescriptor;
type PatternMatchFunctionDescriptor = {
  type: 'pattern';
  pattern: RegExp;
} & BasicMatchFunctionDescriptor;

export class NewLexer extends Transform {
  private buffer: string[] = [];
  private matchResults: MatchResult[] = [];
  private savedMatchResults: MatchResult[] = [];
  private matchFunctionMap: Record<string, LL1MatchFunctionDescriptor> = {};
  private otherMatchFunctions: PatternMatchFunctionDescriptor[] = [];
  private charGenerator?: () => string | undefined;
  private completeCallback?: (error?: Error) => void;
  private status: 'started' | 'stopped' = 'stopped';

  constructor() {
    super({ objectMode: true });

    const matchFunctionDescriptors: MatchFunctionDescriptor[] = [
      {
        type: 'll1',
        name: 'commaLike',
        lookAhead: ',',
        matchFunction: () => this.matchCommaLike(),
      },
      {
        type: 'll1',
        lookAhead: ':',
        name: 'columnEqual',
        matchFunction: () => this.matchColumnLike(),
      },
    ];
    this.registerMatchFunctions(matchFunctionDescriptors);
  }

  private matchCommaLike(): boolean {
    if (this.match(',')) {
      this.matchResults.push({ content: ',', tokenClassName: 'comma' });
      return true;
    }

    return false;
  }

  private matchColumnLike(): boolean {
    if (this.match(':=')) {
      return true;
    } else if (this.match(':->')) {
      return true;
    } else {
      return false;
    }
  }

  private registerMatchFunctions(descriptors: MatchFunctionDescriptor[]): void {
    for (const descriptor of descriptors) {
      if (descriptor.type === 'll1') {
        this.matchFunctionMap[descriptor.lookAhead] = descriptor;
      } else {
        this.otherMatchFunctions.push(descriptor);
      }
    }
  }

  private askOneMore(): string | undefined {
    if (this.charGenerator) {
      const charMaybe = this.charGenerator();
      if (charMaybe) {
        return charMaybe;
      }
      return charMaybe;
    }
    return undefined;
  }

  private askMore(charsCount: number): string[] {
    const result: string[] = [];
    for (let i = 0; i < charsCount; i++) {
      const char = this.askOneMore();
      if (!char) {
        break;
      }
      result.push(char);
    }

    return result;
  }

  private match(content: string): boolean {
    const more = this.askMore(content.length - this.buffer.length);
    if (more.length) {
      this.buffer = [...this.buffer, ...more];
    }

    if (content.length === this.buffer.length) {
      for (let i = 0; i < content.length; i++) {
        if (content[i] !== this.buffer[i]) {
          return false;
        }
      }
    }

    return true;
  }

  private findMatchFunctions(head: string): MatchFunctionDescriptor[] {
    const descriptors: MatchFunctionDescriptor[] = [];
    if (this.matchFunctionMap[head]) {
      descriptors.push(this.matchFunctionMap[head]);
      return;
    }

    for (const descriptor of this.otherMatchFunctions) {
      if (descriptor.pattern.test(head)) {
        descriptors.push(descriptor);
      }
    }

    return descriptors;
  }

  private complete(): void {
    if (this.completeCallback) {
      this.completeCallback();
    }
    this.status = 'stopped';
  }

  public start(
    charGenerator: () => string | undefined,
    callback: (error?: Error) => void,
  ): void {
    this.charGenerator = charGenerator;
    this.completeCallback = callback;

    const charMaybe = this.askOneMore();
    if (charMaybe) {
      this.buffer.push(charMaybe);
    } else {
      this.complete();
      return;
    }

    while (this.buffer.length) {
      const head = this.buffer[0];
      const matchFunctionDescriptors = this.findMatchFunctions(head);
      this.matchResults = [];
      for (const matchFunctionDescriptor of matchFunctionDescriptors) {
        matchFunctionDescriptor.matchFunction();
      }

      if (this.matchResults.length === 0) {
        this.complete();
        break;
      }

      this.matchResults.sort((a, b) => b.content.length - a.content.length);
      const matchResult = this.matchResults[0];
      this.savedMatchResults.push(matchResult);
    }
  }
}

@Injectable()
export class NewLexerFactoryService {}
