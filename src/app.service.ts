import { Injectable } from '@nestjs/common';
import { SyntaxSymbolHelper } from './parser/helpers';
import { ToCharacters, ToToken } from './lexer/lexer';
import { createInterface } from 'readline';
import {
  allRules,
  allSymbols,
  nonTerminalSymbols,
  terminalSymbols,
} from './parser/config';
import { LL1PredictiveParser, ToTerminalNode } from './parser/parser';
import {
  SyntaxAnalysisConfiguration,
  SyntaxConfiguration,
  SyntaxSymbol,
} from './parser/interfaces';
import { stdin, stdout } from 'process';
import { ExpressionTranslate } from './translate/translate';

@Injectable()
export class AppService {
  main(): void {
    const syntaxConfiguration: SyntaxConfiguration = {
      symbols: allSymbols,
      rules: allRules,
      specialSymbol: {
        entrySymbol: allSymbols.list,
        epsilonSymbol: allSymbols.epsilon,
        endOfFileSymbol: allSymbols.endOfFile,
      },
    };
    const symbolHelper = new SyntaxSymbolHelper(syntaxConfiguration);
    // symbolHelper.printPredictiveTable();
    const syntaxAnalysisConfiguration: SyntaxAnalysisConfiguration = {
      ...syntaxConfiguration,
      syntaxAnalysisPartner: symbolHelper,
    };

    const lineStream = createInterface({ input: stdin, output: stdout });

    let lineNumber = 0;
    const asking = () => {
      lineStream.question(`\nIn[]: `, (expression) => {
        toChars.write(expression);
      });
    };

    asking();

    const toChars = new ToCharacters();
    const toToken = new ToToken();
    const toTerminalNode = new ToTerminalNode(syntaxAnalysisConfiguration);
    const parse = new LL1PredictiveParser(syntaxAnalysisConfiguration);
    const translate = new ExpressionTranslate();
    // const evaluate = new Evaluate();

    // const inputString1 = '124 + 456 * ( 3.178 - 4965.0 * .145 ) - 5 / 3 + 2.259';
    // const inputString2 = '4 * (.1 - 1.) + 2';

    toChars.pipe(toToken).pipe(toTerminalNode).pipe(parse).pipe(translate);

    translate.on('data', (datum) => {
      console.log(`\nOut[${lineNumber}]:`);
      lineNumber = lineNumber + 1;

      console.log('tree');
      console.log(datum);

      asking();
    });
  }
}
