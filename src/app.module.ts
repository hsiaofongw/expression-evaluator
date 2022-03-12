import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LexicalAnalyzerModule } from './lexer/lexer.module';
import { EvaluateController } from './controllers/evaluate/evaluate.controller';
import { SessionController } from './controllers/session/session.controller';

@Module({
  providers: [AppService],
  imports: [LexicalAnalyzerModule],
  controllers: [EvaluateController, SessionController],
})
export class AppModule {}
