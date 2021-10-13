import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LexicalAnalyzerModule } from './lexical-analyzer/lexical-analyzer.module';
import { separators } from './separators';

@Module({
  providers: [AppService],
  imports: [LexicalAnalyzerModule.config(separators)],
})
export class AppModule {}
