import { Injectable } from '@nestjs/common';
import { LexicalAnalyzer } from './lexical-analyzer/lexical-analyzer.service';
import { IMainService } from './types';
import { syntax, SyntaxTerm, toBCNR } from './syntax';

type Mark = {
  startIndex: number;
  length: number;
  content: string;
};

type SyntaxTreeNode = {
  marks: Mark[];
  term: SyntaxTerm;
  children?: SyntaxTreeNode[];
};

@Injectable()
export class AppService implements IMainService {
  constructor(private lexicalAnalyzer: LexicalAnalyzer) {}

  main(): void {
    const testString = '1 + (-10) - 1 * 2 * 3 / 4 - 5';

    const tokenDescriptors = this.lexicalAnalyzer
      .tokenize(testString)
      .tokens.filter((token) => token.name !== 'Space');

    console.log(tokenDescriptors);

    console.log(toBCNR(syntax));

    const synctaxTreeNodes: SyntaxTreeNode[] = tokenDescriptors.map((desc) => ({
      marks: [
        {
          startIndex: desc.startIndex,
          length: desc.length,
          content: desc.content,
        },
      ],
      term: SyntaxTerm.create({
        isTerminal: true,
        name: desc.name,
      }),
    }));

    console.log(synctaxTreeNodes);
  }
}
