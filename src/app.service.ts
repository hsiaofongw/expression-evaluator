import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { syntaxAnalysisConfiguration } from './parser/helpers';
import { ToCharacters, ToToken } from './lexer/lexer';
import { LL1PredictiveParser, ToTerminalNode } from './parser/parser';
import { stdout } from 'process';
import { ExpressionTranslate } from './translate/translate';
import { ExpressionNodeSerialize } from './translate/serialize';
import { Evaluator, PreEvaluator } from './translate/evaluate';
import { EvaluateResultObject } from './translate/interfaces';
import { filter, Observable, Subject } from 'rxjs';
import {
  IPublicInputObject,
  IPublicOutputObject,
  IREPLEnvironmentDescriptor,
} from './interfaces';

const stat = {
  replCreated: 0,
};

/** 所有请求公用这两个 Subject, 按照各自的 topicId 认领 */
const inputSubject$ = new Subject<IPublicInputObject>();
const outputSubject$ = new Subject<IPublicOutputObject>();

@Injectable()
export class AppService {
  public static logger = new Logger(AppService.name);

  public static async newREPLEnvironment(): Promise<IREPLEnvironmentDescriptor> {
    // 初始化
    const topicId = uuidv4();
    const initialSeqNum = 0;
    let currentSeqNum = initialSeqNum;
    const resultObjsBuffer: EvaluateResultObject[] = [];
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

    const replEnv: IREPLEnvironmentDescriptor = { topicId, initialSeqNum };

    stat.replCreated = stat.replCreated + 1;
    AppService.logger.log(
      `Created REPLEnv: ${JSON.stringify(replEnv)}, total created: ${
        stat.replCreated
      }`,
    );
    return replEnv;
  }

  createSession() {
    return AppService.newREPLEnvironment();
  }

  evaluate(exprIn: IPublicInputObject): Observable<IPublicOutputObject> {
    return new Observable<IPublicOutputObject>((obs) => {
      outputSubject$
        .pipe(filter((res) => res.topicId === exprIn.topicId))
        .subscribe((res) => {
          obs.next(res);
          obs.complete();
        });

      inputSubject$.next(exprIn);
    });
  }
}
