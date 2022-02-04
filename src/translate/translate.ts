/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Node } from 'src/parser/interfaces';
import { Transform, TransformCallback } from 'stream';
import {
  BuiltInArithmeticFunctionName,
  ExpressionNode,
  FunctionNode,
  IdentifierNode,
  ValueNode,
} from './interfaces';

type Evaluator = (node: Node) => void;
type EvaluatorMap = Record<string, Evaluator>;

export class ExpressionTranslate extends Transform {
  _nodeStack: ExpressionNode[] = [];

  _evaluatorMap: EvaluatorMap = {
    "L -> E L'": (node: Node) => {
      if (node.type === 'nonTerminal') {
        const v1 = node.children[0];
        const v2 = node.children[1];
        if (v1.type === 'nonTerminal' && v2.type === 'nonTerminal') {
          // evaluate v1
          this._getEvaluator(v1.ruleName, v1)(v1);

          // get v1
          const v1ExpressionNode: ExpressionNode =
            this._nodeStack.pop() as ExpressionNode;

          // put v1 in a list
          const listNode: FunctionNode = {
            type: 'function',
            functionName: 'List',
            children: [v1ExpressionNode],
          };

          // push list[v1]
          this._nodeStack.push(listNode);

          // evaluate L'
          this._getEvaluator(v2.ruleName, v2)(v2);
        }
      }
    },

    "L' -> , E L'": (node: Node) => {
      if (node.type === 'nonTerminal') {
        const v2 = node.children[1];
        const v3 = node.children[2];

        if (v2.type === 'nonTerminal' && v3.type === 'nonTerminal') {
          const previousValue: FunctionNode =
            this._nodeStack.pop() as any as FunctionNode;

          this._getEvaluator(v2.ruleName, v2)(v2);
          const currentValue: ExpressionNode =
            this._nodeStack.pop() as ExpressionNode;

          previousValue.children.push(currentValue);
          this._nodeStack.push(previousValue);

          this._getEvaluator(v3.ruleName, v3)(v3);
        }
      }
    },

    "L' -> ε": (_: Node) => {},

    "E -> T E'": (node: Node) => {
      if (node.type === 'nonTerminal') {
        this._evalauteSequentially(node.children);
      }
    },

    "E' -> '+' T E'": (node: Node) => {
      this._evaluateArithmetic(node, 'Plus');
    },

    "E' -> '-' T E'": (node: Node) => {
      this._evaluateArithmetic(node, 'Minus');
    },

    "E' -> ε": (_: Node) => {},

    "T -> F T'": (node: Node) => {
      if (node.type === 'nonTerminal') {
        this._evalauteSequentially(node.children);
      }
    },

    "T' -> '*' F T'": (node: Node) => {
      this._evaluateArithmetic(node, 'Times');
    },

    "T' -> '/' F T'": (node: Node) => {
      this._evaluateArithmetic(node, 'Divide');
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
        const numberNode = node.children[0];
        if (numberNode.type === 'terminal' && numberNode.token) {
          const valueString = numberNode.token.content;
          const value = parseFloat(valueString);
          const valueNode: ValueNode = { type: 'value', value: value };
          this._nodeStack.push(valueNode);
        }
      }
    },

    "F -> id F'": (node: Node) => {
      if (node.type === 'nonTerminal') {
        const v1 = node.children[0];
        const v2 = node.children[1];
        if (v1.type === 'terminal' && v1.token?.content) {
          const functionName = v1.token.content;
          const functionNode: FunctionNode = {
            type: 'function',
            functionName: functionName,
            children: [],
          };
          this._nodeStack.push(functionNode);
          if (v2.type === 'nonTerminal') {
            this._getEvaluator(v2.ruleName, v2)(v2);
          }
        }
      }
    },

    "F' -> [ L ]": (node: Node) => {
      if (node.type === 'nonTerminal') {
        const v2 = node.children[1];
        if (v2.type === 'nonTerminal') {
          this._getEvaluator(v2.ruleName, v2)(v2);
          const listNode = this._nodeStack.pop() as FunctionNode;

          const functionNode = this._nodeStack.pop() as FunctionNode;
          functionNode.children = listNode.children;
          this._nodeStack.push(functionNode);
        }
      }
    },

    "F' -> ε": (node: Node) => {
      if (node.type === 'nonTerminal') {
        const functionNode = this._nodeStack.pop() as any as FunctionNode;
        const functionName = functionNode.functionName;
        const identifier = functionName;
        const identifierNode: IdentifierNode = {
          type: 'identifier',
          identifier: identifier,
        };
        this._nodeStack.push(identifierNode);
      }
    },
  };

  constructor() {
    super({ objectMode: true });
  }

  private _getEvaluator(evaluatorName: string, node: Node): Evaluator {
    const result = this._evaluatorMap[evaluatorName];

    // console.log({ evaluatorName, node, result });

    return result;
  }

  private _evalauteSequentially(nodes: Node[]) {
    for (const node of nodes) {
      if (node.type === 'nonTerminal') {
        this._getEvaluator(node.ruleName, node)(node);
      }
    }
  }

  private _evaluateArithmetic(node: Node, type: BuiltInArithmeticFunctionName) {
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
        const v2Value = this._nodeStack.pop() as ExpressionNode;
        const previousValue = this._nodeStack.pop() as ExpressionNode;
        const currentValue: ExpressionNode = {
          type: 'function',
          functionName: type,
          children: [previousValue, v2Value],
        };
        this._nodeStack.push(currentValue);
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
      this._getEvaluator(node.ruleName, node)(node);
      this.push(this._nodeStack.pop());
    }
    callback();
  }
}
