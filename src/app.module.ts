import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LexicalAnalyzerModule } from './lexical-analyzer/lexical-analyzer.module';

@Module({
  providers: [AppService],
  imports: [LexicalAnalyzerModule],
})
export class AppModule {}
