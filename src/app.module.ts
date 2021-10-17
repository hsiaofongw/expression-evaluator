import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { EvaluatorModule } from './evaluator/evaluator.module';
import { LexicalAnalyzerModule } from './lexer/lexer.module';
import { separators } from './lexer/separators';

@Module({
  providers: [AppService],
  imports: [LexicalAnalyzerModule.config(separators), EvaluatorModule],
})
export class AppModule {}
