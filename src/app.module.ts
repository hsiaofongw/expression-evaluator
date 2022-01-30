import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LexicalAnalyzerModule } from './lexer/lexer.module';

@Module({
  providers: [AppService],
  imports: [LexicalAnalyzerModule],
})
export class AppModule {}
