/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Node } from 'src/parser/interfaces';
import { Transform, TransformCallback } from 'stream';
import { ExpressionNode, FunctionNode, IdentifierNode } from './interfaces';

type Evaluator = (node: Node) => void;
type EvaluatorMap = Record<string, Evaluator>;

export class ExpressionNodeHelper {
  public static nodeToString(node: ExpressionNode): string {
    if (node.type === 'function') {
      const functionName = node.functionName;
      const parameters = node.children
        .map((_n) => ExpressionNodeHelper.nodeToString(_n))
        .join(', ');
      return `${functionName}[${parameters}]`;
    } else if (node.type === 'string') {
      return '"' + node.value.toString() + '"';
    } else if (node.type === 'nothing') {
      return '';
    } else {
      return node.value.toString();
    }
  }

  public static print(node: ExpressionNode): void {
    console.log(ExpressionNodeHelper.nodeToString(node));
  }
}

export class ExpressionTranslate extends Transform {
  _nodeStack: ExpressionNode[] = [];

  _evaluatorMap: EvaluatorMap = {
    "S -> S' CMP_0": (node) => {
      this._evaluateEveryChild(node);
    },

    "CMP_0 -> == S' CMP_0": (node) => this._reduce(node, 'EqualQ', 1, 2),
    'CMP_0 -> ε': (_) => {},

    "S' -> A": (node) => this._evaluateEveryChild(node),

    "S' -> CMP_1": (node) => this._evaluateEveryChild(node),

    "S' -> str": (node) => {
      if (node.type === 'nonTerminal') {
        const v1 = node.children[0];
        if (v1.type === 'terminal' && v1.token) {
          const stringContent = v1.token.content;
          this._pushNode({
            type: 'string',
            value: stringContent,
          });
        }
      }
    },

    'A -> { L }': (node) => {
      if (node.type === 'nonTerminal') {
        this._nodeStack.push(this._makeFunctionNode('List', []));
        this._evaluate(node.children[1]);
      }
    },

    'L -> ε': (_) => {},

    "L -> S L'": (node) => this._reduceByAppend(node, 0, 1),

    "L' -> , S L'": (node) => this._reduceByAppend(node, 1, 2),

    "L' -> ε": (_) => {},

    'CMP_1 -> E CMP_2': (node) => this._evaluateEveryChild(node),

    'CMP_2 -> > E CMP_2': (node) => this._reduce(node, 'GreaterThan', 1, 2),

    'CMP_2 -> < E CMP_2': (node) => this._reduce(node, 'LessThan', 1, 2),

    'CMP_2 -> >= E CMP_2': (node) =>
      this._reduce(node, 'GreaterThanOrEqual', 1, 2),

    'CMP_2 -> <= E CMP_2': (node) =>
      this._reduce(node, 'LessThanOrEqual', 1, 2),

    'CMP_2 -> ε': (_) => {},

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
          const value = parseFloat(v1.token.content);
          const isInteger = Math.floor(value) === value;
          this._pushNode({
            type: 'value',
            value: value,
            numberType: isInteger ? 'integer' : 'float',
          });
        }
      }
    },

    'F -> id P': (node) => {
      if (node.type === 'nonTerminal') {
        const v1 = node.children[0];
        const v2 = node.children[1];
        if (v1.type === 'terminal' && v1.token) {
          const identifier = v1.token.content;
          this._pushNode({ type: 'identifier', value: identifier });
          this._evaluate(v2);
        }
      }
    },

    "P -> [ L ] P'": (node) => {
      if (node.type === 'nonTerminal') {
        const identifierNode = this._popNode() as IdentifierNode;
        const identifier = identifierNode.value;
        const functionNode = this._makeFunctionNode(identifier, []);
        this._pushNode(functionNode);
        this._evaluate(node.children[1]);
        this._evaluate(node.children[3]);
      }
    },

    'P -> = S': (node) => this._assign(node),
    "P' -> = S": (node) => this._assign(node),

    'P -> ε': (_) => {},
    "P' -> ε": (_) => {},
  };

  constructor() {
    super({ objectMode: true });
  }

  private _assign(node: Node): void {
    if (node.type === 'nonTerminal') {
      const leftValueNode = this._popNode();
      const assignNode = this._makeFunctionNode('Assign', []);
      this._evaluate(node.children[1]);
      const rightValue = this._popNode();
      assignNode.children.push(leftValueNode);
      assignNode.children.push(rightValue);
      this._pushNode(assignNode);
    }
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

  private _reduceByAppend(node: Node, currIdx: number, nextIdx: number): void {
    if (node.type === 'nonTerminal') {
      const prev = this._popNode();
      if (prev.type === 'function') {
        this._evaluate(node.children[currIdx]);
        const current = this._popNode();
        const appended: FunctionNode = {
          type: 'function',
          functionName: prev.functionName,
          children: [...prev.children, current],
        };
        this._pushNode(appended);
        this._evaluate(node.children[nextIdx]);
      }
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
