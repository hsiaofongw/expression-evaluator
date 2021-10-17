import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GlobalContext } from './context';
import { IEvaluatorBuilder } from './expression.evaluator';
import { IEvaluator } from './types';

@Injectable()
export class PlusEvaluatorBuilder implements IEvaluatorBuilder {
  constructor(private moduleRef: ModuleRef) {}
  build(context: GlobalContext) {
    return new PlusEvaluator(context, this.moduleRef);
  }
}

export class PlusEvaluator implements IEvaluator {
  constructor(private context: GlobalContext, private moduleRef: ModuleRef) {}
  evaluate(): IEvaluator[] {
    this.context.push('POP R1');
    this.context.push('POP R2');
    this.context.push('ADD');
    this.context.push('PUSH R1');
    return [];
  }
  getContext() {
    return this.context;
  }
}
