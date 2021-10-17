import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GlobalContext } from './context';
import { IEvaluatorBuilder } from './expression.evaluator';
import { IEvaluator } from './types';

@Injectable()
export class TimesEvaluatorBuilder implements IEvaluatorBuilder {
  constructor(private moduleRef: ModuleRef) {}
  build(context: GlobalContext) {
    return new TimesEvaluator(context, this.moduleRef);
  }
}

export class TimesEvaluator implements IEvaluator {
  constructor(private context: GlobalContext, private moduleRef: ModuleRef) {}
  evaluate(): IEvaluator[] {
    this.context.push('POP R1');
    this.context.push('POP R2');
    this.context.push('MULTIPLY');
    this.context.push('PUSH R1');
    return [];
  }
  getContext() {
    return this.context;
  }
}
