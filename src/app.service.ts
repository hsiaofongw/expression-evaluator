import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { syntaxAnalysisConfiguration } from './parser/helpers';
import { ToCharacters, ToToken } from './lexer/lexer';
import { LL1PredictiveParser, ToTerminalNode } from './parser/parser';
import { stdout } from 'process';
import { ExpressionTranslate } from './translate/translate';
import { ExpressionNodeSerialize } from './translate/serialize';
import { Evaluator, PreEvaluator } from './translate/evaluate';
import { EvaluateResultObject } from './translate/interfaces';
import { filter, Subject } from 'rxjs';

type REPLEnvironmentDescriptor = {
  topicId: string;
  initialSeqNum: number;
};

type PublicInputObject = {
  topicId: string;
  exprInputString: string;
  seqNum: number;
};

type PublicOutputObject = {
  topicId: string;
  printContent: string;
  exprContent: string;
  seqNum: number;
};

/** 所有请求公用这两个 Subject, 按照各自的 topicId 认领 */
const inputSubject$ = new Subject<PublicInputObject>();
const outputSubject$ = new Subject<PublicOutputObject>();

async function newREPLEnvironment(): Promise<REPLEnvironmentDescriptor> {
  // 初始化
  const topicId = uuidv4();
  const initialSeqNum = 0;
  let currentSeqNum = initialSeqNum;
  const resultObjsBuffer: EvaluateResultObject[] = [];
  const promptContentFn = (seqNum: number) => `In[${seqNum}]:= `;
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
  serialize.on('data', (resultString: string) => {
    outputSubject$.next({
      topicId,
      exprContent: resultString,
      printContent: '',
      seqNum: currentSeqNum,
    });
  });
  inputSubject$.pipe(filter((d) => d.topicId === topicId)).subscribe((d) => {
    const inputContent = d.exprInputString.replace(/\s/g, ' ');
    toChars.write(inputContent.trim());
  });

  return { topicId, initialSeqNum };
}

@Injectable()
export class AppService {
  createSession() {
    return newREPLEnvironment();
  }
}
