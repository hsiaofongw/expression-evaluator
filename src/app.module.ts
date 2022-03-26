import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { EvaluateController } from './controllers/evaluate/evaluate.controller';
import { SessionController } from './controllers/session/session.controller';
import { ConfigModule } from '@nestjs/config';
import { NewLexerModule } from './new-lexer/new-lexer.module';
import { ParserModule } from './parser/parser.module';

@Module({
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env'],
    }),
    NewLexerModule,
    ParserModule,
  ],
  controllers: [EvaluateController, SessionController],
})
export class AppModule {}
