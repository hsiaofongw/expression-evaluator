import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LexicalAnalyzerModule } from './lexer/lexer.module';
import { separators } from './lexer/separators';

@Module({
  providers: [AppService],
  imports: [LexicalAnalyzerModule.config(separators)],
})
export class AppModule {}
