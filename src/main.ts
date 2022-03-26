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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = app.get(ConfigService);
  const inDebug = config.get('NODE_ENV') === 'debug';
  const logger = new Logger(bootstrap.name);
  logger.log(`In Debug Mode: ${inDebug}`);
  await app.listen(3000);

  if (inDebug) {
    console.clear();
    startTestREPL(app);
  }
}
bootstrap();

async function startTestREPL(app: INestApplication) {
  const lexerFactory = app.get(NewLexerFactoryService);
  const parserFactory = app.get(ParserFactoryService);
  const langSpecs = app.get('LanguageSpecification');

  const stringSplit = StringHelper.makeCharSplitTransform(); // 一个把输入 Buffer 流转换成字符流的 Transform，其中每个字符仍然是用 string 表示
  const lexer = lexerFactory.makeLexer(); // 一次读入一个字符，每次输出时输出一个 token
  const mapToEol = lexerFactory.makeEOLMapTransform(); // 将分号映射为 EOL 字符
  const stringEscapeTransform = StringHelper.makeStringEscapeTransform(); // 处理字符串转义
  const dropBlank = StringHelper.makeStripTransform('blank');
  const dropComment = StringHelper.makeStripTransform('comment');
  const parser = parserFactory.makeParser(langSpecs); // 基于 token 流构建语法分析树
  const translator = new ExpressionTranslate();
  const serialize = new ExpressionNodeSerialize();

  stdin
    .pipe(stringSplit)  // 输入 Buffer 拆成一个个字符
    .pipe(lexer)  // 字符组合成 token
    .pipe(mapToEol) // 分号 token 映射为 eol token
    .pipe(stringEscapeTransform) // 字符串转义
    .pipe(dropBlank) // 去掉空白区域（对应 blank token）
    .pipe(dropComment) // 去掉注释（对应 comment token）
    .pipe(parser) // 读取 token 流中的 token, 构建语法分析树
    .pipe(translator)
    .pipe(serialize)
    .pipe( // 结果打印到控制台上
      new Writable({
        objectMode: true,
        write(chunk, encoding, callback) {
          console.log(chunk);
          callback();
        },
      }),
    );
  // lexer.pipe(stringEscapeTransform).pipe(parser);

  // // 开始 REPL
  // parser.on('data', (resultString: Node) => {
  //   console.log(resultString);
  // });
  // stdin.on('data', (d) => {
  //   const inputContent = d.toString('utf-8').replace(/\s/g, ' ');
  //   inputContent.split('').forEach(char => lexer.write(char));
  // });
}

async function startCommandLineREPL(app: INestApplication) {
  // 初始化
  const initialSeqNum = 0;
  let currentSeqNum = initialSeqNum;
  const resultObjsBuffer: EvaluateResultObject[] = [];
  const promptContentFn = (seqNum: number) => `In[${seqNum}]:= `;
  const outputPrefixFn = (seqNum: number) => `\nOut[${seqNum}]= `;
  const outputPostfix = '\n\n';
  const parserFactory = app.get(ParserFactoryService);
  const langSpecs = app.get('LanguageSpecification');

  const lexerFactory = app.get(NewLexerFactoryService);

  const toToken = lexerFactory.makeLexer(); // Tokenizing
  const parse = parserFactory.makeParser(langSpecs) // Parsing, i.e. build tree
  const translate = new ExpressionTranslate(); // Tree to Expr transformation
  const preEvaluate = new PreEvaluator(); // Pre-Evaluate
  const evaluate = new Evaluator(currentSeqNum); // Evaluate Expr
  const serialize = new ExpressionNodeSerialize(); // Expr to string transformation

  let inputBuffer = '';

  /** 组建解释器 */
  toToken.pipe(parse).pipe(translate).pipe(preEvaluate).pipe(evaluate);

  // 连接到 AssembledEvaluator, 并将 AssembledEvaluator 连接到 Serializer
  evaluate.on('data', (evaluateResultObject: EvaluateResultObject) => {
    const receivedSeqNum = evaluateResultObject.seqNum;
    const expectingSeqNum = currentSeqNum;
    resultObjsBuffer.push(evaluateResultObject);
    if (receivedSeqNum === expectingSeqNum) {
      resultObjsBuffer.sort((a, b) => a.seqNum - b.seqNum);
      const maxReceivedSeqNum =
        resultObjsBuffer[resultObjsBuffer.length - 1].seqNum;
      while (resultObjsBuffer.length) {
        serialize.write(resultObjsBuffer.shift().result);
      }
      currentSeqNum = maxReceivedSeqNum + 1;
      stdout.write(promptContentFn(currentSeqNum));
    }
  });

  // 开始 REPL
  stdout.write(promptContentFn(currentSeqNum));
  serialize.on('data', (resultString: string) => {
    stdout.write(outputPrefixFn(currentSeqNum));
    stdout.write(resultString);
    stdout.write(outputPostfix);
  });
  stdin.on('data', (d) => {
    const inputContent = d.toString('utf-8').replace(/\s/g, ' ');
    const semiColumnIndex = inputContent.indexOf(';');
    if (semiColumnIndex === -1) {
      inputBuffer = inputBuffer + inputContent;
    } else {
      for (let i = 0; i < inputContent.length; i++) {
        if (inputContent[i] === ';') {
          if (inputBuffer.trim().length) {
            toToken.write(inputBuffer.trim());
            inputBuffer = '';
          }
          continue;
        }
        inputBuffer = inputBuffer + inputContent[i];
      }
    }
  });
}
