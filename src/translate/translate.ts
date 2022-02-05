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

export class ExpressionNodeHelper {
  public static nodeToString(node: ExpressionNode): string {
    if (node.type === 'identifier') {
      return node.identifier;
    } else if (node.type === 'value') {
      return node.value.toString();
    } else {
      const functionName = node.functionName;
      const parameters = node.children
        .map((_n) => ExpressionNodeHelper.nodeToString(_n))
        .join(', ');
      return `${functionName}[${parameters}]`;
    }
  }
}

export class ExpressionTranslate extends Transform {
  _nodeStack: ExpressionNode[] = [];

  _evaluatorMap: EvaluatorMap = {
    'S -> A': (node) => this._evaluateEveryChild(node),

    'A -> { L }': (node) => {
      if (node.type === 'nonTerminal') {
        this._nodeStack.push(this._makeFunctionNode('List', []));
        this._evaluate(node.children[1]);
      }
    },

    'L -> ε': (_) => {},

    "L -> S L'": (node) => this._reduce(node, 'Append', 0, 1),

    "L' -> , S L'": (node) => this._reduce(node, 'Append', 1, 2),

    "L' -> ε": (_) => {},

    'S -> E': (node) => this._evaluateEveryChild(node),

    "E -> T E'": (node) => this._evaluateEveryChild(node),

    "E' -> '+' T E'": (node) => this._reduce(node, 'Plus', 1, 2),

    "E' -> '-' T E'": (node) => this._reduce(node, 'Minus', 1, 2),

    "E' -> ε": (_) => {},

    "T -> F T'": (node) => this._evaluateEveryChild(node),

    "T' -> '*' F T'": (node) => this._reduce(node, 'Times', 1, 2),

    "T' -> '/' F T'": (node) => this._reduce(node, 'Divide', 1, 2),

    "T' -> ε": (_) => {},

    "F -> '(' E ')'": (node) => {
      if (node.type === 'nonTerminal') {
        this._evaluate(node.children[1]);
      }
    },

    'F -> number': (node) => {
      if (node.type === 'nonTerminal') {
        const v1 = node.children[0];
        if (v1.type === 'terminal' && v1.token) {
          this._pushNode({
            type: 'value',
            value: parseFloat(v1.token.content),
          });
        }
      }
    },

    'F -> id P': (node) => {
      if (node.type === 'nonTerminal') {
        const v1 = node.children[0];
        if (v1.type === 'terminal' && v1.token) {
          this._pushNode(this._makeFunctionNode(v1.token.content, []));
          this._evaluate(node.children[1]);
        }
      }
    },

    'P -> ε': (_) => {
      const fn = this._popNode() as FunctionNode;
      const id: IdentifierNode = {
        type: 'identifier',
        identifier: fn.functionName,
      };
      this._pushNode(id);
    },

    'P -> [ L ]': (node) => {
      if (node.type === 'nonTerminal') {
        const functionNode = this._popNode() as FunctionNode;
        const parameters = this._makeFunctionNode('Parameters', []);
        this._pushNode(parameters);
        this._evaluate(node.children[1]);
        const appendedParameters = this._popNode() as FunctionNode;
        functionNode.children = [appendedParameters];
        this._pushNode(functionNode);
      }
    },
  };

  constructor() {
    super({ objectMode: true });
  }

  private _makeFunctionNode(
    functionName: string,
    children: ExpressionNode[],
  ): FunctionNode {
    return { type: 'function', functionName, children };
  }

  private _reduce(
    node: Node,
    functionName: string,
    currIdx: number,
    nextIdx: number,
  ): void {
    if (node.type === 'nonTerminal') {
      const prev = this._popNode();
      this._evaluate(node.children[currIdx]);
      const current = this._popNode();

      const sum: FunctionNode = {
        type: 'function',
        functionName: functionName,
        children: [prev, current],
      };
      this._pushNode(sum);

      this._evaluate(node.children[nextIdx]);
    }
  }

  private _evaluateEveryChild(node: Node): void {
    if (node.type === 'nonTerminal') {
      node.children.forEach((child) => this._evaluate(child));
    }
  }

  private _pushNode(node: ExpressionNode): void {
    this._nodeStack.push(node);
  }

  private _popNode(): ExpressionNode {
    return this._nodeStack.pop() as ExpressionNode;
  }

  private _evaluate(node: Node): void {
    if (node.type === 'nonTerminal') {
      const evaluator = this._evaluatorMap[node.ruleName];
      if (typeof evaluator === 'function') {
        evaluator(node);
      } else {
        console.error(`No evaluator`);
        console.error({ node });
        process.exit(1);
      }
    } else {
      console.error(`Try evaluate a terminal node`);
      console.error({ node });
      process.exit(1);
    }
  }

  _transform(
    node: Node,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    if (node.type === 'nonTerminal') {
      this._evaluate(node);
      this.push(this._nodeStack.pop());
    }
    callback();
  }
}
