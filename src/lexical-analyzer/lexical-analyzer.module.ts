import { DynamicModule, Module } from '@nestjs/common';
import { Separator } from 'src/types';
import { LexicalAnalyzer } from './lexical-analyzer.service';

@Module({})
export class LexicalAnalyzerModule {
  static config(separators: Separator[]): DynamicModule {
    return {
      module: LexicalAnalyzerModule,
      providers: [
        { provide: 'SEPARATORS', useValue: separators },
        LexicalAnalyzer,
      ],
      exports: [LexicalAnalyzer],
    };
  }
}
