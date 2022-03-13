/* eslint-disable @typescript-eslint/no-unused-vars */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { syntaxAnalysisConfiguration } from './parser/helpers';
import { ToCharacters, ToToken } from './lexer/lexer';
import { LL1PredictiveParser, ToTerminalNode } from './parser/parser';
import { stdin, stdout } from 'process';
import { ExpressionTranslate } from './translate/translate';
import { ExpressionNodeSerialize } from './translate/serialize';
import { Evaluator, PreEvaluator } from './translate/evaluate';
import { EvaluateResultObject } from './translate/interfaces';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

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
    startCommandLineREPL();
  }
}
bootstrap();

async function startCommandLineREPL() {
  // 初始化
  const initialSeqNum = 0;
  let currentSeqNum = initialSeqNum;
  const resultObjsBuffer: EvaluateResultObject[] = [];
  const promptContentFn = (seqNum: number) => `In[${seqNum}]:= `;
  const outputPrefixFn = (seqNum: number) => `\nOut[${seqNum}]= `;
  const outputPostfix = '\n\n';
  const toChars = new ToCharacters();
  const toToken = new ToToken();
  const toTerminalNode = new ToTerminalNode(syntaxAnalysisConfiguration);
  const parse = new LL1PredictiveParser(syntaxAnalysisConfiguration);
  const translate = new ExpressionTranslate();
  const preEvaluate = new PreEvaluator();
  const evaluate = new Evaluator(currentSeqNum);
  const serialize = new ExpressionNodeSerialize();
  let inputBuffer = '';

  /** 组建解释器 */
  toChars
    .pipe(toToken)
    .pipe(toTerminalNode)
    .pipe(parse)
    .pipe(translate)
    .pipe(preEvaluate)
    .pipe(evaluate);

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
            toChars.write(inputBuffer.trim());
            inputBuffer = '';
          }
          continue;
        }
        inputBuffer = inputBuffer + inputContent[i];
      }
    }
  });
}
