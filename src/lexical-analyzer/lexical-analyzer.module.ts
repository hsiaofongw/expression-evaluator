import { Module } from '@nestjs/common';
import { LexicalAnalyzer } from './lexical-analyzer.service';
import { separators } from './separators';

@Module({
  providers: [
    {
      provide: 'SEPARATORS',
      useValue: separators,
    },
    LexicalAnalyzer,
  ],
  exports: [LexicalAnalyzer],
})
export class LexicalAnalyzerModule {}
