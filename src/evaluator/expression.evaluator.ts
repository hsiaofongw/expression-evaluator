import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { allTerms } from 'src/data/definitions';
import { SyntaxTermGroup } from 'src/types/syntax';
import { GlobalContext } from './context';
import { IEvaluator } from './types';

export interface IEvaluatorBuilder {
  build(context: GlobalContext): IEvaluator;
}

@Injectable()
export class ExpressionEvaluatorBuilder implements IEvaluatorBuilder {
  constructor(private moduleRef: ModuleRef) {}

  build(context: GlobalContext): IEvaluator {
    return new ExpressionEvaluator(context, this.moduleRef);
  }
}

export class ExpressionEvaluator implements IEvaluator {
  constructor(private context: GlobalContext, private moduleRef: ModuleRef) {}

  evaluate(): IEvaluator[] {
    console.log(this.context);

    const childrenNodes = this.context.getTreeNode().children;

    if (childrenNodes && childrenNodes.length) {
      const childrenToken = SyntaxTermGroup.createFromTerms(
        childrenNodes.map((node) => node.term),
      ).toString();

      switch (childrenToken) {
        case '<Number> "Plus" <Expression>':
          const numberNode = childrenNodes[0];
          const plusNode = childrenNodes[1];
          const expressionNode = childrenNodes[2];

          const numberEvaluatorBuilder = this.moduleRef.get(
            allTerms.numberTerm.toString(),
          ) as IEvaluatorBuilder;
          const numberEvaluator = numberEvaluatorBuilder.build(
            this.context.fork(numberNode),
          );

          const expressionEvaluatorBuilder = this.moduleRef.get(
            allTerms.expressionTerm.toString(),
          ) as IEvaluatorBuilder;
          const expressionEvaluator = expressionEvaluatorBuilder.build(
            this.context.fork(expressionNode),
          );

          const plusEvaluatorBuilder = this.moduleRef.get(
            allTerms.plusTerm.toString(),
          ) as IEvaluatorBuilder;
          const plusEvaluator = plusEvaluatorBuilder.build(
            this.context.fork(plusNode),
          );

          return [numberEvaluator, expressionEvaluator, plusEvaluator];

        default:
          break;
      }
    }

    return [];
  }

  getContext() {
    return this.context;
  }
}
