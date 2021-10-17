import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GlobalContext } from './context';
import { IEvaluatorBuilder } from './expression.evaluator';
import { IEvaluator } from './types';

@Injectable()
export class DivideByEvaluatorBuilder implements IEvaluatorBuilder {
  constructor(private moduleRef: ModuleRef) {}
  build(context: GlobalContext) {
    return new DivideByEvaluator(context, this.moduleRef);
  }
}

export class DivideByEvaluator implements IEvaluator {
  constructor(private context: GlobalContext, private moduleRef: ModuleRef) {}
  evaluate(): IEvaluator[] {
    console.log(this.context);
    this.context.push('POP R2');
    this.context.push('POP R1');
    this.context.push('DIVIDE');
    return [];
  }
  getContext() {
    return this.context;
  }
}
