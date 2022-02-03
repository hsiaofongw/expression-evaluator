/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Node } from 'src/parser/interfaces';
import { Transform, TransformCallback } from 'stream';
import { ArithmeticType, EvaluateNode } from './interfaces';

type Evaluator = (node: Node) => void;
type EvaluatorMap = Record<string, Evaluator>;

export class ExpressionTranslate extends Transform {
  _valueStack: EvaluateNode[] = [];

  _evaluatorMap: EvaluatorMap = {
    "E -> T E'": (node: Node) => {
      if (node.type === 'nonTerminal') {
        this._evalauteSequentially(node.children);
      }
    },

    "E' -> '+' T E'": (node: Node) => {
      this._evaluateArithmetic(node, 'plus');
    },

    "E' -> '-' T E'": (node: Node) => {
      this._evaluateArithmetic(node, 'minus');
    },

    "E' -> ε": (_: Node) => {},

    "T -> F T'": (node: Node) => {
      if (node.type === 'nonTerminal') {
        this._evalauteSequentially(node.children);
      }
    },

    "T' -> '*' F T'": (node: Node) => {
      this._evaluateArithmetic(node, 'times');
    },

    "T' -> '/' F T'": (node: Node) => {
      this._evaluateArithmetic(node, 'divde');
    },

    "T' -> ε": (_: Node) => {},

    "F -> '(' E ')'": (node: Node) => {
      if (node.type === 'nonTerminal') {
        const v2 = node.children[1];
        if (v2.type === 'nonTerminal') {
          this._getEvaluator(v2.ruleName, v2)(v2);
        }
      }
    },

    'F -> number': (node: Node) => {
      if (node.type === 'nonTerminal') {
        this._valueStack.push({ type: 'value', value: node.children[0] });
      }
    },
  };

  constructor() {
    super({ objectMode: true });
  }

  private _getEvaluator(evaluatorName: string, node: Node): Evaluator {
    const result = this._evaluatorMap[evaluatorName];
    console.log({ evaluatorName, result, node });
    return result;
  }

  private _evalauteSequentially(nodes: Node[]) {
    for (const node of nodes) {
      if (node.type === 'nonTerminal') {
        this._getEvaluator(node.ruleName, node)(node);
      }
    }
  }

  private _evaluateArithmetic(node: Node, type: ArithmeticType) {
    if (node.type === 'nonTerminal') {
      const v1 = node.children[0];
      const v2 = node.children[1];
      const v3 = node.children[2];
      if (
        v1.type === 'terminal' &&
        v2.type === 'nonTerminal' &&
        v3.type === 'nonTerminal'
      ) {
        this._getEvaluator(v2.ruleName, v2)(v2);
        const v2Value = this._valueStack.pop() as EvaluateNode;
        const previousValue = this._valueStack.pop() as EvaluateNode;
        const currentValue: EvaluateNode = {
          type: type,
          children: [previousValue, v2Value],
        };
        this._valueStack.push(currentValue);
        this._getEvaluator(v3.ruleName, v3)(v3);
      }
    }
  }

  _transform(
    node: Node,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    if (node.type === 'nonTerminal') {
      this._evaluatorMap[node.ruleName](node);
      const value = this._valueStack.pop() as EvaluateNode;
      console.log({ value });
      this.push(value);
    }
    callback();
  }
}
