import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { allTerms } from 'src/data/definitions';
import { GlobalContext } from './context';
import { IEvaluatorBuilder } from './expression.evaluator';
import { IEvaluator } from './types';

@Injectable()
export class RootEvaluatorBuilder implements IEvaluatorBuilder {
  constructor(private moduleRef: ModuleRef) {}

  build(context: GlobalContext) {
    return new RootEvaluator(context, this.moduleRef);
  }
}

export class RootEvaluator implements IEvaluator {
  constructor(private context: GlobalContext, private moduleRef: ModuleRef) {}

  evaluate(): IEvaluator[] {
    const evaluatorBuilder = this.moduleRef.get(
      allTerms.expressionTerm.toString(),
    ) as IEvaluatorBuilder;

    const evaluator = evaluatorBuilder.build(
      this.context.fork(this.context.getTreeNode()),
    );

    return [evaluator];
  }

  getContext() {
    return this.context;
  }
}
