/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { initialState } from 'src/new-lexer/config';
import { MatchFunction, Token } from 'src/new-lexer/interfaces';
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
  public makeLexer(): NewLexer {
    return new NewLexer();
  }

  public makeEOLMapTransform(): Transform {
    return new Transform({
      objectMode: true,
      transform(chunk: Token, encoding, callback) {
        if (chunk.tokenClassName === 'semicolumn') {
          const eofToken: Token = { tokenClassName: 'eof', content: '' };
          this.push(eofToken);
        } else {
          this.push(chunk);
        }
        callback();
      },
    });
  }
}
