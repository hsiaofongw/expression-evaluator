import { Injectable } from '@nestjs/common';
import { Lexer } from './lexer/lexer.service';
import { IMainService } from './types/token';
import { syntaxDefinition } from './data/definitions';
import { SyntaxTreeNodeGroup } from './types/tree';
import { stdin } from 'process';
import { SyntaxRewriteContext } from './types/context';

@Injectable()
export class AppService implements IMainService {
  constructor(private lexicalAnalyzer: Lexer) {}

  main(): void {
    const testString = '1 + (-10) - 1 * 2 * 3 / 4 - 5';
    // const testString = '(-10) - 1 * 2 * 3 / 4 - 5';
    console.log(testString);

    const treeNodesGroup = SyntaxTreeNodeGroup.createFromStringAndLexer(
      testString,
      this.lexicalAnalyzer,
    );

    const ruleSelectorMap = syntaxDefinition.makeIndex();
    console.log(syntaxDefinition.toBCNRString());

    const context = SyntaxRewriteContext.createFromTokenNodes(treeNodesGroup);

    console.log({
      syntaxDefinition,
      treeNodesGroup,
      ruleSelectorMap,
      context,
    });

    context.stepUntilConverge(ruleSelectorMap);
    console.log(context.treeNodesGroup);

    stdin.on('data', (data) => console.log(data.toString('utf-8')));
  }
}
