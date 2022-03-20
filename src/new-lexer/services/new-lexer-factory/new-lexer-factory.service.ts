/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CharObject } from 'src/lexer/interfaces';
import { initialState } from 'src/new-lexer/config';
import { MatchFunction } from 'src/new-lexer/interfaces';
import { Transform, TransformCallback } from 'stream';

class NewLexer extends Transform {
  private currentState: MatchFunction = initialState;

  constructor() {
    super({ objectMode: true });
  }

  _transform(
    char: string,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.currentState(
      char,
      callback,
      (result) => {
        this.push(result);
      },
      (nextState) => {
        this.currentState = nextState;
      },
    );
  }
}

@Injectable()
export class NewLexerFactoryService {
  makeLexer(): NewLexer {
    return new NewLexer();
  }
}
