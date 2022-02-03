import { Injectable } from '@nestjs/common';
import { SyntaxSymbolHelper } from './parser/helpers';
import {
  ToCharacters,
  ToIndexedCharacter,
  ToRawToken,
  ToTypedToken,
  ToTypedCharacter,
} from './lexer/lexer';
import { createInterface } from 'readline';
import {
  allStates,
  allTokenClasses,
  charClass as allCharClasses,
  stateTransitions,
} from './lexer/config';
import { allRules, allSymbols } from './parser/config';
import { LL1PredictiveParser, ToTerminalNode } from './parser/parser';
import {
  SyntaxAnalysisConfiguration,
  SyntaxConfiguration,
} from './parser/interfaces';
import { stdin, stdout } from 'process';
import { ExpressionTranslate } from './translate/translate';
import { Evaluate } from './translate/evaluate';

@Injectable()
export class AppService {
  main(): void {
    const syntaxConfiguration: SyntaxConfiguration = {
      symbols: allSymbols,
      rules: allRules,
      specialSymbol: {
        entrySymbol: allSymbols.expression,
        epsilonSymbol: allSymbols.epsilon,
        endOfFileSymbol: allSymbols.endOfFile,
      },
    };
    const symbolHelper = new SyntaxSymbolHelper(syntaxConfiguration);
    const syntaxAnalysisConfiguration: SyntaxAnalysisConfiguration = {
      ...syntaxConfiguration,
      syntaxAnalysisPartner: symbolHelper,
    };

    const lineStream = createInterface({ input: stdin, output: stdout });

    let lineNumber = 0;
    const asking = () => {
      lineStream.question(`\nIn[${lineNumber}]: `, (expression) => {
        toChars.write(expression);
      });
    };

    asking();

    const toChars = new ToCharacters();
    const toIndexedChars = new ToIndexedCharacter();
    const toTypedChars = new ToTypedCharacter(allCharClasses);
    const toRawToken = new ToRawToken({
      allStates,
      allCharClasses,
      transitions: stateTransitions,
      startState: allStates.startState,
    });
    const toTypedToken = new ToTypedToken(allTokenClasses);
    const toTerminalNode = new ToTerminalNode(syntaxAnalysisConfiguration);
    const parse = new LL1PredictiveParser(syntaxAnalysisConfiguration);
    const translate = new ExpressionTranslate();
    const evaluate = new Evaluate();

    // const inputString1 = '124 + 456 * ( 3.178 - 4965.0 * .145 ) - 5 / 3 + 2.259';
    // const inputString2 = '4 * (.1 - 1.) + 2';

    toChars
      .pipe(toIndexedChars)
      .pipe(toTypedChars)
      .pipe(toRawToken)
      .pipe(toTypedToken)
      .pipe(toTerminalNode)
      .pipe(parse)
      .pipe(translate)
      .pipe(evaluate);

    evaluate.on('data', (answer) => {
      console.log(`\nOut[${lineNumber}]: ${answer}`);
      lineNumber = lineNumber + 1;
      asking();
    });
  }
}
