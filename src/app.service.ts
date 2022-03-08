import { Injectable } from '@nestjs/common';
import { syntaxAnalysisConfiguration } from './parser/helpers';
import { ToCharacters, ToToken } from './lexer/lexer';
import { LL1PredictiveParser, ToTerminalNode } from './parser/parser';
import { stdin, stdout } from 'process';
import { ExpressionTranslate } from './translate/translate';
import { ExpressionNodeSerialize } from './translate/serialize';
import { Evaluator, PreEvaluator } from './translate/evaluate';
import { Subject } from 'rxjs';
import { Expr } from './translate/interfaces';

type EvaluateResultObject = { seqNum: number; result: Expr };

let inputStreamFlushSentinel = ';';
export const inputStreamFlushSentinelUpdater$ = new Subject<string>();
inputStreamFlushSentinelUpdater$.subscribe((sentinel) => {
  inputStreamFlushSentinel = sentinel;
});

@Injectable()
export class AppService {
  main(): void {
    // 初始化
    const initialSeqNum = 0;
    let currentSeqNum = initialSeqNum;
    const resultObjsBuffer: EvaluateResultObject[] = [];
    const promptContentFn = (seqNum: number) => `In[${seqNum}]:= `;
    const outputPrefixFn = (seqNum: number) => `\nOut[${seqNum}]= \n\n`;
    const outputPostfix = '\n\n';
    const toChars = new ToCharacters();
    const toToken = new ToToken();
    const toTerminalNode = new ToTerminalNode(syntaxAnalysisConfiguration);
    const parse = new LL1PredictiveParser(syntaxAnalysisConfiguration);
    const translate = new ExpressionTranslate();
    const preEvaluate = new PreEvaluator();
    const evaluate = new Evaluator(currentSeqNum);
    const serialize = new ExpressionNodeSerialize();

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
      let lines = inputContent.split(inputStreamFlushSentinel);
      lines = lines
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      for (const line of lines) {
        toChars.write(line.trim());
      }
    });
  }
}
