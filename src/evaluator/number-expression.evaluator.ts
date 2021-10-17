import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SyntaxTermGroup } from 'src/types/syntax';
import { ISyntaxTreeNode } from 'src/types/tree';
import { GlobalContext } from './context';
import { IEvaluatorBuilder } from './expression.evaluator';
import { IEvaluator } from './types';

@Injectable()
export class NumberExpressionEvaluatorBuilder implements IEvaluatorBuilder {
  constructor(private moduleRef: ModuleRef) {}
  build(context: GlobalContext) {
    return new NumberExpressionEvaluator(context, this.moduleRef);
  }
}

export class NumberExpressionEvaluator implements IEvaluator {
  constructor(private context: GlobalContext, private moduleRef: ModuleRef) {}
  evaluate(): IEvaluator[] {
    console.log(this.context);

    const children = this.context.getTreeNode().children;
    if (!(children && children.length)) {
      return [];
    }

    const childrenTermGroup = SyntaxTermGroup.createFromTerms(
      children.map((node) => node.term),
    );

    const node0 = children[0];
    const node1 = children[1];
    const node2 = children[2];

    const nodes: ISyntaxTreeNode[] = [];

    const childrenToken = childrenTermGroup.toString();
    switch (childrenToken) {
      case '"LeftParenthesis" <Expression> "RightParenthesis"':
        nodes[0] = node1;
        break;
      case '<NumberExpression> "Times" <Number>':
      case '<NumberExpression> "DivideBy" <Number>':
      case '<Number> "Times" <Number>':
      case '<Number> "DivideBy" <Number>':
        nodes[0] = node0;
        nodes[1] = node2;
        nodes[2] = node1;
        break;

      default:
        break;
    }

    if (nodes.length === 0) {
      return;
    }

    const evaluators: IEvaluator[] = [];
    for (const node of nodes) {
      const term = node.term;
      const evaluatorBuilder = this.moduleRef.get(
        term.toString(),
      ) as IEvaluatorBuilder;
      const evaluator = evaluatorBuilder.build(
        this.context.fork(node),
      ) as IEvaluator;
      evaluators.push(evaluator);
    }

    return evaluators;
  }

  getContext() {
    return this.context;
  }
}
