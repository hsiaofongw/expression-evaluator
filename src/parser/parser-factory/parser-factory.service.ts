/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PredictTableHelperFactory } from '../predict-table-helper-factory/predict-table-helper-factory.service';
import { Token } from 'src/new-lexer/interfaces';
import { Transform, TransformCallback } from 'stream';
import { PredictTableHelper } from '../predict-table-helper-factory/predict-table-helper-factory.service';
import {
  ILanguageSpecification,
  Node,
  NonTerminalNode,
  ProductionRule,
} from '../interfaces';

export class LL1PredictiveParser extends Transform {
  private parseStack!: Node[];
  private rootNode!: Node; // root node of syntax tree

  private get stackTop(): Node {
    return this.parseStack[this.parseStack.length - 1];
  }

  constructor(
    private specification: ILanguageSpecification,
    private predictTableHelper: PredictTableHelper,
  ) {
    super({ objectMode: true });
    this.init();
  }

  /** 初始化或者重置都是调用这个函数 */
  private init(): void {
    this.rootNode = {
      type: 'nonTerminal',
      symbol: this.specification.startSymbol,
      children: [],
      ruleName: '', // 在解析的过程中，展开它的时候再写上
    };
    this.parseStack = [this.rootNode];
  }

  _transform(
    inputBufferHead: Token,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    // 如果能展开则先尝试展开，展开后再匹配，展开不了就报错
    // stacktop 的非终结符号节点展开之后可能仍是非终结符号节点，所以要用 while 循环重复几遍
    while (this.parseStack.length && this.stackTop.type === 'nonTerminal') {
      const expandSbl = this.parseStack.pop() as NonTerminalNode;

      const expandRule = this.predictTableHelper.getExpandingRule(
        expandSbl.symbol,
        inputBufferHead,
      ) as ProductionRule;

      // 记下这条 rule 的名字
      expandSbl.ruleName = expandRule.name;

      // 展开
      expandSbl.children = expandRule.rhs.map((symbol) => {
        if (symbol.type === 'terminal') {
          return { type: 'terminal', symbol } as Node;
        } else {
          return {
            type: 'nonTerminal',
            children: [],
            symbol,
            ruleName: '',
          } as Node;
        }
      });

      // 倒序入栈
      for (let i = 0; i < expandSbl.children.length; i++) {
        this.parseStack.push(
          expandSbl.children[expandSbl.children.length - 1 - i],
        );
      }
    }

    if (this.parseStack.length) {
      if (this.stackTop.type === 'terminal') {
        this.stackTop.token = inputBufferHead;
        this.parseStack.pop();
      }
    } else {
      this.push(this.rootNode);
      this.init();
    }
    callback();
  }
}

@Injectable()
export class ParserFactoryService {
  constructor(private predictTableHelperFactory: PredictTableHelperFactory) {}

  public makeParser(speficiation: ILanguageSpecification): LL1PredictiveParser {
    return new LL1PredictiveParser(
      speficiation,
      this.predictTableHelperFactory.makePredictTableHelper(speficiation),
    );
  }
}
