import { Injectable } from '@nestjs/common';
import { Lexer } from './lexer/lexer.service';
import { IMainService } from './types/token';
import { syntaxDefinition } from './data/definitions';
import { SyntaxTreeNodeGroup } from './types/tree';

@Injectable()
export class AppService implements IMainService {
  constructor(private lexicalAnalyzer: Lexer) {}

  main(): void {
    const testString = '1 + (-10) - 1 * 2 * 3 / 4 - 5';

    const tokenGroup = this.lexicalAnalyzer
      .tokenize(testString)
      .tokenGroup.selectSubGroup((token) => token.name !== 'Space');

    const syntaxTreeNodeGroup =
      SyntaxTreeNodeGroup.createFromTokenGroup(tokenGroup);

    console.log({ syntaxTreeNodeGroup });

    console.log(syntaxDefinition.toBCNRString());
  }
}
