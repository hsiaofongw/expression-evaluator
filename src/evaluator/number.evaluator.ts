import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SyntaxTermGroup } from 'src/types/syntax';
import { ISyntaxTreeNode } from 'src/types/tree';
import { GlobalContext } from './context';
import { IEvaluatorBuilder } from './expression.evaluator';
import { IEvaluator } from './types';

@Injectable()
export class NumberEvaluatorBuilder implements IEvaluatorBuilder {
  constructor(private moduleRef: ModuleRef) {}
  build(context: GlobalContext) {
    return new NumberEvaluator(context, this.moduleRef);
  }
}

export class NumberEvaluator implements IEvaluator {
  constructor(private context: GlobalContext, private moduleRef: ModuleRef) {}
  evaluate(): IEvaluator[] {
    console.log(this.context);

    const children = this.context.getTreeNode().children;
    if (!(children && children.length)) {
      return [];
    }

    const childrenTerms = children.map((node) => node.term);
    const childrenTermGroup = SyntaxTermGroup.createFromTerms(childrenTerms);
    const childrenToken = childrenTermGroup.toString();
    let value = 0;
    let content = '';
    switch (childrenToken) {
      case '"PositiveNumber"':
        content = children[0].mark?.content;
        if (content) {
          value = parseInt(content);
        }
        this.context.push(`PUSH ${value}`);
        break;
      case '"LeftParenthesis" "Minus" "PositiveNumber" "RightParenthesis"':
        content = children[2].mark?.content;
        if (content) {
          value = 0 - parseInt(content);
          this.context.push(`PUSH ${value}`);
        }

        break;
      default:
        break;
    }

    return [];
  }

  getContext() {
    return this.context;
  }
}
