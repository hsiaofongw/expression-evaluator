import { Module } from '@nestjs/common';
import { NewLexerFactoryService } from './services/new-lexer-factory/new-lexer-factory.service';

@Module({
  providers: [NewLexerFactoryService],
  exports: [NewLexerFactoryService],
})
export class NewLexerModule {}
