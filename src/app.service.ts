import { Injectable } from '@nestjs/common';
import { LexicalAnalyzer } from './lexical-analyzer/lexical-analyzer.service';
import { IMainService } from './types';
import { syntax, toBCNR } from './syntax';

@Injectable()
export class AppService implements IMainService {
  constructor(private lexicalAnalyzer: LexicalAnalyzer) {}

  main(): void {
    const testString = '1 + (-10) - 1 * 2 * 3 / 4 - 5';

    const result = this.lexicalAnalyzer
      .tokenize(testString)
      .tokens.filter((token) => token.name !== 'Space');

    console.log(result);

    console.log(toBCNR(syntax));
  }
}
