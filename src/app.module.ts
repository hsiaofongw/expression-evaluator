import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { LexicalAnalyzerModule } from './lexer/lexer.module';
import { EvaluateController } from './controllers/evaluate/evaluate.controller';
import { SessionController } from './controllers/session/session.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [AppService],
  imports: [
    LexicalAnalyzerModule,
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env'],
    }),
  ],
  controllers: [EvaluateController, SessionController],
})
export class AppModule {}
