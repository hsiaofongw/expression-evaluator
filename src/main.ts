/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { stdin, stdout } from 'process';
import { ExpressionTranslate } from './translate/translate';
import {
  ExpressionNodeSerialize,
  MinimalNodeSerialize,
} from './translate/serialize';
import { Evaluator, PreEvaluator } from './translate/evaluate';
import { ConfigService } from '@nestjs/config';
import { INestApplication, Logger } from '@nestjs/common';
import { NewLexerFactoryService } from './new-lexer/services/new-lexer-factory/new-lexer-factory.service';
import { StringHelper } from './helpers/string-helper';
import { ParserFactoryService } from './parser/parser-factory/parser-factory.service';
import { Command } from 'commander';
import { Readable, Transform, Writable } from 'stream';
import { createReadStream } from 'fs';
import { EvaluateResultObject } from './translate/interfaces';
import { ExprHelper } from './helpers/expr-helpers';

async function bootstrap() {
  const program = new Command();

  program.name('node dist/main').description('表达式求值器').version('2.0.0');

  program
    .command('evaluate <expr>')
    .description('对一个表达式求值，并且将求值结果序列化之后打印到标准输出。')
    .action(async (exprString: string) => {
      const app = await NestFactory.create(AppModule, { logger: false });
      const pipeline = makeEvaluatePipeline(app);
      const miminalSerialize = new MinimalNodeSerialize();
      pipeline.output.pipe(miminalSerialize).pipe(stdout);
      pipeline.input.write(exprString);
      pipeline.input.write('\n'); // 刷新一下缓冲区
    });

  program
    .command('run <scriptFileName>')
    .description(
      '执行一个脚本文件，并且将求值结果（如果有）打印到标准输出。',
    )
    .action(async (scriptFileName: string) => {
      const app = await NestFactory.create(AppModule, { logger: false });

      const evaluatePipeline = makeEvaluatePipeline(app);
      const miminalSerialize = new MinimalNodeSerialize();

      evaluatePipeline.output.pipe(miminalSerialize).pipe(stdout);

      createReadStream(scriptFileName, { encoding: 'utf-8' }).pipe(
        evaluatePipeline.input,
      );
    });

  program
    .command('repl')
    .description('启动一个 REPL 你问一句我答一句交互环境')
    .action(async () => {
      const app = await NestFactory.create(AppModule);
      startREPL(app);
    });

  program
    .command('server')
    .description('启动一个 Server 实例')
    .option('-p, --port <portNumber>', '指定端口号', '3000')
    .action(async (str: { port: string }) => {
      const app = await NestFactory.create(AppModule);
      const portNum = parseInt(str.port, 10);
      app.enableCors();
      await app.listen(portNum);
    });

  program.parse();
}
bootstrap();

/** 组装一条表达式求值管线，返回管线的两端（入口和出口） */
function makeEvaluatePipeline(app: INestApplication): {
  input: Writable;
  output: Readable;
} {
  const currentSeqNum = 0;
  const lexerFactory = app.get(NewLexerFactoryService);
  const parserFactory = app.get(ParserFactoryService);
  const langSpecs = app.get('LanguageSpecification');

  const stringSplit = StringHelper.makeCharSplitTransform(); // 一个把输入字符串转换成字符流的 Transform，其中每个字符仍然是用 string 表示
  const lexer = lexerFactory.makeLexer(); // 一次读入一个字符，每次输出时输出一个 token
  const mapToEol = lexerFactory.makeEOLMapTransform(); // 将分号映射为 EOL 字符
  const stringEscapeTransform = StringHelper.makeStringEscapeTransform(); // 处理字符串转义
  const dropBlank = StringHelper.makeStripTransform('blank');
  const dropComment = StringHelper.makeStripTransform('comment');
  const parser = parserFactory.makeParser(langSpecs); // 基于 token 流构建语法分析树
  const translator = new ExpressionTranslate();
  const preEvaluate = new PreEvaluator(); // Pre-Evaluate
  const evaluate = new Evaluator(currentSeqNum); // Evaluate Expr

  stringSplit // 输入 Buffer 拆成一个个字符
    .pipe(lexer) // 字符组合成 token
    .pipe(mapToEol) // 分号 token 映射为 eol token
    .pipe(stringEscapeTransform) // 字符串转义
    .pipe(dropBlank) // 去掉空白区域（对应 blank token）
    .pipe(dropComment) // 去掉注释（对应 comment token）
    .pipe(parser) // 读取 token 流中的 token, 构建语法分析树
    .pipe(translator) // 翻译
    .pipe(preEvaluate) // 预求值
    .pipe(evaluate); // 求值

  return { input: stringSplit, output: evaluate };
}

/** 开始 REPL */
async function startREPL(app: INestApplication) {
  const evaluatePipeLineTerminals = makeEvaluatePipeline(app);
  const serialize = new ExpressionNodeSerialize();

  // 将输出连接到标准序列化 Transform 实例, 再将序列化的输出连接到标准输出
  evaluatePipeLineTerminals.output.pipe(serialize).pipe(stdout);

  // 将标准输入连接到求值管线的入口端
  stdin
    .pipe(
      new Transform({
        objectMode: true,
        transform(chunk: Buffer, encoding, cb) {
          this.push(chunk.toString('utf-8'));
          cb();
        },
      }),
    )
    .pipe(evaluatePipeLineTerminals.input);

  // 提示用户可以开始输入了
  const currentSeqNum = 0;
  const promptContentFn = (seqNum: number) => `In[${seqNum}]:= `;
  stdout.write(promptContentFn(currentSeqNum));
}
