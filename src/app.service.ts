import { Injectable } from '@nestjs/common';
import { IMainService } from './types/token';
import {
  ToCharacters,
  ToIndexedCharacter,
  Tokenize,
  TokenTyping,
  ToTypedCharacter,
} from './lexer/lexer';
import { createInterface } from 'readline';
import { Readable } from 'stream';
import {
  allStates,
  allTokenClasses,
  charClass as allCharClasses,
  stateTransitions,
} from './lexer/config';

@Injectable()
export class AppService implements IMainService {
  main(): void {
    const inputString = '124 + 456 * ( 3.178 - 4965.0 * .145 ) - 5 / 3 + 2.259';
    const inputStream = Readable.from(inputString);

    const lineStream = createInterface({ input: inputStream });
    const toChars = new ToCharacters();
    const toIndexedChars = new ToIndexedCharacter();
    const toTypedChars = new ToTypedCharacter(allCharClasses);
    const tokenize = new Tokenize({
      allStates,
      allCharClasses,
      transitions: stateTransitions,
      startState: allStates.startState,
    });
    const tokenTyping = new TokenTyping(allTokenClasses);

    lineStream.on('line', (line) => {
      toChars.write(line);
    });

    lineStream.on('close', () => {
      toChars.end();
    });

    toChars
      .pipe(toIndexedChars)
      .pipe(toTypedChars)
      .pipe(tokenize)
      .pipe(tokenTyping);

    tokenTyping.on('data', (data) => {
      console.log(data);
    });
  }
}
