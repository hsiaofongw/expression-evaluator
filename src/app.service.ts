import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EvaluateResultObject } from './translate/interfaces';
import { filter, Observable, Subject } from 'rxjs';
import {
  IPublicInputObject,
  IPublicOutputObject,
  IREPLEnvironmentDescriptor,
} from './interfaces';
import { ILanguageSpecification } from './parser/interfaces';
import { PipelineFactoryService } from './pipeline/pipeline-factory.service';
import { ExprHelper } from './helpers/expr-helpers';

const stat = {
  replCreated: 0,
};

/** 所有请求公用这两个 Subject, 按照各自的 topicId 认领 */
const inputSubject$ = new Subject<IPublicInputObject>();
const outputSubject$ = new Subject<IPublicOutputObject>();

@Injectable()
export class AppService {
  constructor(
    @Inject('LanguageSpecification') private langSpec: ILanguageSpecification,
    private pipelineFactory: PipelineFactoryService,
  ) {}

  public static logger = new Logger(AppService.name);

  public async newREPLEnvironment(): Promise<IREPLEnvironmentDescriptor> {
    // 初始化
    const topicId = uuidv4();
    const pipeline = this.pipelineFactory.makeEvaluatePipeline();

    // 开始 REPL
    pipeline.output.on('data', (evaluateResultObject: EvaluateResultObject) => {
      outputSubject$.next({
        topicId,
        exprContent: ExprHelper.nodeToString(evaluateResultObject.result),
        printContent: '',
        seqNum: evaluateResultObject.seqNum,
      });
    });

    inputSubject$.pipe(filter((d) => d.topicId === topicId)).subscribe((d) => {
      let inputString = d.exprInputString.trim();
      if (inputString.length && inputString[inputString.length - 1] !== ';') {
        inputString = inputString + ';';
      }

      pipeline.input.write(inputString);
      pipeline.input.write('\n');
    });

    const replEnv: IREPLEnvironmentDescriptor = { topicId, initialSeqNum: 0 };

    stat.replCreated = stat.replCreated + 1;
    AppService.logger.log(
      `Created REPLEnv: ${JSON.stringify(replEnv)}, total created: ${
        stat.replCreated
      }`,
    );
    return replEnv;
  }

  createSession() {
    return this.newREPLEnvironment();
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
