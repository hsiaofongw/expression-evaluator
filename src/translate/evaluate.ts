/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transform, TransformCallback } from 'stream';
import {
  Evaluator,
  EvaluatorMap,
  ExpressionNode,
  ExpressionNodeReduceFuntion,
  FunctionNode,
  ValueNode,
} from './interfaces';

type _EvaluateContext = Record<
  string,
  { hitCount: number; node: ExpressionNode }
>;

export class Evaluate extends Transform {
  private _nodeStack: ExpressionNode[] = [];
  private _evaluatorMap: EvaluatorMap = {
    List: (node) => {
      if (node.type === 'function') {
        this._evaluateEveryChild(node);
      }
    },
    Plus: (node) => {
      if (node.type === 'function') {
        this._evaluateArithmetic(
          node,
          this._makeReduceFunction('Add', (a, b) => a + b),
        );
      }
    },
    Minus: (node) => {
      if (node.type === 'function') {
        this._evaluateArithmetic(
          node,
          this._makeReduceFunction('Minus', (a, b) => a - b),
        );
      }
    },
    Times: (node) => {
      if (node.type === 'function') {
        this._evaluateArithmetic(
          node,
          this._makeReduceFunction('Times', (a, b) => a * b),
        );
      }
    },
    Divide: (node) => {
      if (node.type === 'function') {
        this._evaluateArithmetic(
          node,
          this._makeReduceFunction('Divide', (a, b) => a / b),
        );
      }
    },
    Sin: (node) => {
      this._evaluatePrimaryFunction(node, (x) => Math.sin(x));
    },
    Cos: (node) => {
      this._evaluatePrimaryFunction(node, (x) => Math.cos(x));
    },
    Tan: (node) => {
      this._evaluatePrimaryFunction(node, (x) => Math.tan(x));
    },
    Assign: (node) => {
      if (node.type === 'function') {
        const v1 = node.children[0];
        const v2 = node.children[1];
        if (v1.type === 'identifier') {
          this._assign(v1.identifier, v2);
        }
      }
    },
  };

  private _evaluateContext!: _EvaluateContext;

  constructor() {
    super({ objectMode: true });
    this._evaluateContext = {};
    this._preAssign();
  }

  private _preAssign(): void {
    const piNode: ValueNode = { type: 'value', value: Math.PI };
    this._assign('PI', piNode);
  }

  _transform(
    node: ExpressionNode,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this._getEvaluatorFor(node)(node);
    this.push(this._nodeStack.pop() as ExpressionNode);
    for (const x in this._evaluateContext) {
      this._evaluateContext[x].hitCount = 0;
    }
    callback();
  }

  private _makeReduceFunction(
    generalFunctionName: string,
    valueReduceFunction: (a: number, b: number) => number,
  ): ExpressionNodeReduceFuntion {
    return (a, b) => {
      if (a.type === 'value' && b.type === 'value') {
        const result: ValueNode = {
          type: 'value',
          value: valueReduceFunction(a.value, b.value),
        };
        return result;
      } else {
        const result: FunctionNode = {
          type: 'function',
          functionName: generalFunctionName,
          children: [a, b],
        };
        return result;
      }
    };
  }

  private _evaluatePrimaryFunction(
    node: ExpressionNode,
    valueFunction: (value: number) => number,
  ) {
    if (node.type === 'function') {
      const v1 = node.children[0];
      if (v1.type === 'value') {
        const result: ValueNode = {
          type: 'value',
          value: valueFunction(v1.value),
        };
        this._nodeStack.push(result);
        return;
      }

      this._getEvaluatorFor(v1)(v1);
      const evaluatedV1 = this._nodeStack.pop() as ExpressionNode;
      node.children[0] = evaluatedV1;
      if (evaluatedV1.type === 'value') {
        this._getEvaluatorFor(node)(node);
        return;
      }

      this._nodeStack.push(node);
    }
  }

  private _evaluateEveryChild(node: FunctionNode): void {
    const evaluatedNodes: ExpressionNode[] = [];
    for (const child of node.children) {
      this._getEvaluatorFor(child)(child);
      evaluatedNodes.unshift(this._nodeStack.pop() as ExpressionNode);
    }
    node.children = evaluatedNodes;
    this._nodeStack.push(node);
  }

  private _evaluateArithmetic(
    node: FunctionNode,
    reduceFn: (a: ExpressionNode, b: ExpressionNode) => ExpressionNode,
  ): void {
    if (node.type === 'function') {
      if (node.children.every((child) => child.type === 'value')) {
        this._nodeStack.push(node.children.reduce(reduceFn));
        return;
      }

      const originFunctionName = node.functionName;
      node.functionName = 'List';
      this._getEvaluatorFor(node)(node);
      const evaluatedNode = this._nodeStack.pop() as FunctionNode;
      evaluatedNode.functionName = originFunctionName;
      if (evaluatedNode.children.every((child) => child.type === 'value')) {
        this._getEvaluatorFor(evaluatedNode)(evaluatedNode);
      } else {
        this._nodeStack.push(evaluatedNode);
      }
    }
  }

  private _getEvaluatorFor(node: ExpressionNode): Evaluator {
    if (node.type === 'function') {
      const evaluator = this._evaluatorMap[node.functionName];

      if (typeof evaluator !== 'function') {
        console.error(`Miss function: ${node.functionName}`);
        return (node: ExpressionNode) => {
          this._nodeStack.push(node);
        };
      }

      return evaluator;
    } else if (node.type === 'identifier') {
      const identifierEvaluator = (node: ExpressionNode) => {
        if (node.type === 'identifier') {
          const mappedValue = this._getNodeFromContext(node.identifier) ?? node;
          if (mappedValue) {
            this._nodeStack.push(mappedValue);
          } else {
            this._nodeStack.push(node);
          }
        }
      };
      return identifierEvaluator;
    } else if (node.type === 'value') {
      const evaluator = (node: ExpressionNode) => {
        this._nodeStack.push(node);
      };
      return evaluator;
    }
  }

  private _getNodeFromContext(identifier): ExpressionNode | undefined {
    const entry = this._evaluateContext[identifier];
    if (entry) {
      entry.hitCount = entry.hitCount + 1;
      return entry.node;
    }

    return undefined;
  }

  private _assign(identifier: string, node: ExpressionNode): void {
    this._getEvaluatorFor(node)(node);
    const evaluatedNode = this._nodeStack.pop() as ExpressionNode;
    const entry: _EvaluateContext[keyof _EvaluateContext] = {
      hitCount: 0,
      node: evaluatedNode,
    };
    this._evaluateContext[identifier] = entry;
    this._nodeStack.push(evaluatedNode);
  }
}
