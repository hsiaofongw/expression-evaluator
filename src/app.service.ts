import { Injectable } from '@nestjs/common';
import { SyntaxSymbolHelper } from './parser/helpers';
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
import { allRules, allSymbols } from './parser/config';

@Injectable()
export class AppService {
  main(): void {
    const symbolHelper = new SyntaxSymbolHelper({
      symbols: allSymbols,
      rules: allRules,
      specialSymbol: {
        entrySymbol: allSymbols.expression,
        epsilonSymbol: allSymbols.epsilon,
        endOfFileSymbol: allSymbols.endOfFile,
      },
    });

    const symbols = [
      allSymbols.expression,
      allSymbols.expressionExpand,
      allSymbols.term,
      allSymbols.termExpand,
      allSymbols.factor,
      allSymbols.plus,
      allSymbols.minus,
      allSymbols.times,
      allSymbols.divideBy,
      allSymbols.leftParenthesis,
      allSymbols.rightParenthesis,
      allSymbols.epsilon,
      allSymbols.number,
    ];

    console.log('FIRST:');
    for (const symbol of symbols) {
      const first = symbolHelper.first([symbol]);
      const symbolDisplay = symbol.displayName ?? symbol.name;
      const firstDisplay = first
        .map((_symbol) => _symbol.displayName ?? _symbol.name)
        .join(', ');
      console.log(`${symbolDisplay}: [${firstDisplay}]`);
    }

    const symbolsToFollow = [
      allSymbols.expression,
      allSymbols.expressionExpand,
      allSymbols.term,
      allSymbols.termExpand,
      allSymbols.factor,
    ];
    console.log('FOLLOW:');
    for (const symbol of symbolsToFollow) {
      const follow = symbolHelper.follow(symbol);
      const symbolDisplay = symbol.displayName ?? symbol.name;
      const followDisplay = follow
        .map((_symbol) => _symbol.displayName ?? _symbol.name)
        .join(', ');
      console.log(`${symbolDisplay}: [${followDisplay}]`);
    }

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

    console.log('TOKENS:');
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
