import { Injectable } from '@nestjs/common';
import { Lexer } from './lexer/lexer.service';
import { IMainService } from './types/token';
import { syntaxDefinition } from './data/definitions';
import { SyntaxTreeNodeGroup } from './types/tree';
import { stdin } from 'process';
import { SyntaxRule } from './types/syntax';
import { SyntaxRewriteContext } from './types/context';

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

    const selectorMap = syntaxDefinition.makeIndex();

    const context = SyntaxRewriteContext.create({
      treeNodesGroup: syntaxTreeNodeGroup,
      ruleSelectorMap: selectorMap,
    });

    console.log({
      syntaxDefinition,
      syntaxTreeNodeGroup,
      selectorMap,
      context,
    });

    stdin.on('data', (data) => console.log(data.toString('utf-8')));
  }
}
