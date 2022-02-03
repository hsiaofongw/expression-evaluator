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
import { Readable } from 'stream';
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
import { stdin } from 'process';
import { ToList, ToArithmeticTree } from './arithmetic/to-addible';
import { SelectSymbol } from './helpers/select';
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
      console.log(`${symbolDisplay}: [ ${firstDisplay} ]`);
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
      console.log(`${symbolDisplay}: [ ${followDisplay} ]`);
    }

    console.log('PREDICTIVE TABLE:');
    const rowSymbols = [
      allSymbols.expression,
      allSymbols.expressionExpand,
      allSymbols.term,
      allSymbols.termExpand,
      allSymbols.factor,
    ];
    const colSymbols = [
      allSymbols.number,
      allSymbols.plus,
      allSymbols.minus,
      allSymbols.times,
      allSymbols.divideBy,
      allSymbols.leftParenthesis,
      allSymbols.rightParenthesis,
      allSymbols.endOfFile,
    ];
    const predictiveTable = symbolHelper.getPredictiveAnalysisTable();
    for (const rowSymbol of rowSymbols) {
      for (const colSymbol of colSymbols) {
        const rowDisplay = rowSymbol.displayName ?? rowSymbol.name;
        const colDisplay = colSymbol.displayName ?? colSymbol.name;
        const entryHeaderDisplay = `[ ${rowDisplay}, ${colDisplay} ]: `;

        const ruleIds: number[] = [];
        if (predictiveTable[rowSymbol.id]) {
          if (predictiveTable[rowSymbol.id][colSymbol.id]) {
            for (const id of predictiveTable[rowSymbol.id][colSymbol.id]) {
              ruleIds.push(id);
            }
          }
        }
        const rules = ruleIds.map((ruleId) =>
          symbolHelper.getProductionRuleFromId(ruleId),
        );

        const ruleDisplays = rules.map((rule) => {
          const lhs = rule.lhs;
          const rhs = rule.rhs;
          const ruleBodyDisplay = rhs
            .map((sbl) => sbl.displayName ?? sbl.name)
            .join(' ');

          return `${lhs.displayName ?? lhs.name} -> ${ruleBodyDisplay}`;
        });
        const paddingSpace = ' '.repeat(entryHeaderDisplay.length);
        const entryBodyDisplay = ruleDisplays.join('\n' + paddingSpace);
        const entryDisplay = `${entryHeaderDisplay}${entryBodyDisplay}`;
        console.log(entryDisplay);
      }
    }

    const inputString = '124 + 456 * ( 3.178 - 4965.0 * .145 ) - 5 / 3 + 2.259';
    // const inputString = '4 * (.1 - 1.) + 2';
    const inputStream = Readable.from(inputString);

    const lineStream = createInterface({ input: inputStream });
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

    lineStream.on('line', (line) => {
      toChars.write(line);
    });

    lineStream.on('close', () => {
      toChars.end();
    });

    toChars
      .pipe(toIndexedChars)
      .pipe(toTypedChars)
      .pipe(toRawToken)
      .pipe(toTypedToken)
      .pipe(toTerminalNode)
      .pipe(parse)
      .pipe(translate)
      .pipe(evaluate);

    evaluate.on('data', (data) => {
      console.log('output');
      console.log(data);
    });

    stdin.on('data', (e) => {
      console.log(e);
    });
  }
}
