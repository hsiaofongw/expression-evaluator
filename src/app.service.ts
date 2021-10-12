import { Injectable } from '@nestjs/common';
import { LexicalAnalyzer } from './lexical-analyzer/lexical-analyzer.service';
import { IMainService } from './types';

@Injectable()
export class AppService implements IMainService {
  constructor(private lexicalAnalyzer: LexicalAnalyzer) {}

  main(): void {
    const testString =
      'node /src/app.js      --abc --cd=efg --h=ij -j --port=8080';
    const result = this.lexicalAnalyzer.tokenize(testString);
    console.log(result);
  }
}
