import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { allTerms } from 'src/data/definitions';
import { SyntaxTermGroup } from 'src/types/syntax';
import { ISyntaxTreeNode } from 'src/types/tree';
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

    const childrenNodes = this.context.getTreeNode().children;

    if (childrenNodes && childrenNodes.length) {
      const childrenToken = SyntaxTermGroup.createFromTerms(
        childrenNodes.map((node) => node.term),
      ).toString();

      const node0 = childrenNodes[0];
      const node1 = childrenNodes[1];
      const node2 = childrenNodes[2];

      const nodes: ISyntaxTreeNode[] = [];

      switch (childrenToken) {
        case '<Number> "Plus" <Expression>':
        case '<NumberExpression> "Minus" <Number>':
        case '<Number> "Minus" <Expression>':
        case '<Number> "Plus" <Expression>':
          nodes[0] = node0;
          nodes[1] = node2;
          nodes[2] = node1;
          break;

        default:
          break;
      }

      const evaluators: IEvaluator[] = [];
      for (const node of nodes) {
        const term = node.term;
        const termToken = term.toString();
        const evaluatorBuilder = this.moduleRef.get(
          termToken,
        ) as IEvaluatorBuilder;
        const evaluator = evaluatorBuilder.build(this.context.fork(node));
        evaluators.push(evaluator);
      }

      return evaluators;
    }

    return [];
  }

  getContext() {
    return this.context;
  }
}
