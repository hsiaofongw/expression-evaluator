import { Injectable } from '@nestjs/common';
import { LexicalAnalyzer } from './lexical-analyzer/lexical-analyzer.service';
import { IMainService } from './tokens';
import { SyntaxGeneratingRuleGroup, SyntaxTerm } from './syntax';
import { syntaxDefinition } from './definitions';
import { SyntaxTreeNode, SyntaxTreeNodeGroup } from './tree';

@Injectable()
export class AppService implements IMainService {
  constructor(private lexicalAnalyzer: LexicalAnalyzer) {}

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
