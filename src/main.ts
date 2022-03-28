/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { stdin, stdout } from 'process';
import { ExpressionTranslate } from './translate/translate';
import { ExpressionNodeSerialize } from './translate/serialize';
import { Evaluator, PreEvaluator } from './translate/evaluate';
import { EvaluateResultObject } from './translate/interfaces';
import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';
import { NewLexerFactoryService } from './new-lexer/services/new-lexer-factory/new-lexer-factory.service';
import { StringHelper } from './helpers/string-helper';
import { ParserFactoryService } from './parser/parser-factory/parser-factory.service';
import { Node } from './parser/interfaces';
import { Writable } from 'stream';
import { Command } from 'commander';

const program = new Command();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = app.get(ConfigService);
  const inDebug = config.get('NODE_ENV') === 'debug';
  const logger = new Logger(bootstrap.name);
  logger.log(`In Debug Mode: ${inDebug}`);
  await app.listen(3000);

  console.clear();
  program.name('node dist/main').description('表达式求值器').version('2.0.0');

  program
    .option('--evaluate <exprString>', '对表达式字符串求值，求值结果表达式序列化之后打印到标准输出')
    .option('--run-script <fileName>', '运行脚本文件，最后一条表达式的求值结果序列化之后打印到标准输出')
    .option('--repl', '启动一个 REPL 你问一句我答一句交互环境',)
    .option('--server', '以服务器模式启动');

  program.parse();
}
bootstrap();

async function startTestREPL(app: INestApplication) {
  const currentSeqNum = 0;
  const lexerFactory = app.get(NewLexerFactoryService);
  const parserFactory = app.get(ParserFactoryService);
  const langSpecs = app.get('LanguageSpecification');
  const promptContentFn = (seqNum: number) => `In[${seqNum}]:= `;
  const stringSplit = StringHelper.makeCharSplitTransform(); // 一个把输入 Buffer 流转换成字符流的 Transform，其中每个字符仍然是用 string 表示
  const lexer = lexerFactory.makeLexer(); // 一次读入一个字符，每次输出时输出一个 token
  const mapToEol = lexerFactory.makeEOLMapTransform(); // 将分号映射为 EOL 字符
  const stringEscapeTransform = StringHelper.makeStringEscapeTransform(); // 处理字符串转义
  const dropBlank = StringHelper.makeStripTransform('blank');
  const dropComment = StringHelper.makeStripTransform('comment');
  const parser = parserFactory.makeParser(langSpecs); // 基于 token 流构建语法分析树
  const translator = new ExpressionTranslate();
  const preEvaluate = new PreEvaluator(); // Pre-Evaluate
  const evaluate = new Evaluator(currentSeqNum); // Evaluate Expr
  const serialize = new ExpressionNodeSerialize();

  stdin
    .pipe(stringSplit) // 输入 Buffer 拆成一个个字符
    .pipe(lexer) // 字符组合成 token
    .pipe(mapToEol) // 分号 token 映射为 eol token
    .pipe(stringEscapeTransform) // 字符串转义
    .pipe(dropBlank) // 去掉空白区域（对应 blank token）
    .pipe(dropComment) // 去掉注释（对应 comment token）
    .pipe(parser) // 读取 token 流中的 token, 构建语法分析树
    .pipe(translator) // 翻译
    .pipe(preEvaluate) // 预求值
    .pipe(evaluate) // 求值
    .pipe(serialize) // 序列化
    .pipe(stdout); // 输出

  // 开始 REPL
  stdout.write(promptContentFn(currentSeqNum));
}
