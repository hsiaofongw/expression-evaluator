import { DynamicModule, Module } from '@nestjs/common';
import { Separator } from 'src/types/token';
import { Lexer } from './lexer.service';

@Module({})
export class LexicalAnalyzerModule {
  static config(separators: Separator[]): DynamicModule {
    return {
      module: LexicalAnalyzerModule,
      providers: [{ provide: 'SEPARATORS', useValue: separators }, Lexer],
      exports: [Lexer],
    };
  }
}
