import { Transform, TransformCallback } from 'stream';
import { defaultEvaluator, evaluators } from './config';
import {
  ExpressionNode,
  ExpressionNodeEvaluator,
  IdentifierNode,
  IEvaluateContext,
} from './interfaces';
import { ExpressionNodeHelper } from './translate';

export class Evaluate extends Transform implements IEvaluateContext {
  private _nodeStack: ExpressionNode[] = [];
  private _globalContext: Record<string, ExpressionNode> = {};
  private _outputHistory: ExpressionNode[] = [];

  constructor() {
    super({ objectMode: true });

    this._nodeStack = [];
    this._globalContext = {};
  }

  public getOutputHistoryLength(): number {
    return this._outputHistory.length;
  }

  private _getEvaluatorForFunctionNode(
    functionName: string,
  ): ExpressionNodeEvaluator {
    // match by content at first if possible
    for (const evaluator of evaluators) {
      if (
        evaluator.match.type === 'functionName' &&
        evaluator.match.functionName === functionName
      ) {
        return evaluator;
      }
    }

    // if not exact match, using First Regexp Match strategy
    for (const evaluator of evaluators) {
      if (
        evaluator.match.type === 'regexp' &&
        functionName.match(evaluator.match.regexp)
      ) {
        return evaluator;
      }
    }

    // if all above tries failed, resort to defaultEvaluator
    return defaultEvaluator;
  }

  _transform(
    node: ExpressionNode,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this._evaluate(node);
    const value = this._popNode();
    this._outputHistory.push(value);
    this.push(value);
    callback();
  }

  _evaluate(node: ExpressionNode): void {
    if (node.type === 'function') {
      const evaluator = this._getEvaluatorForFunctionNode(node.functionName);
      evaluator.action(node, this);
    }

    if (node.type === 'identifier') {
      this._pushNode(this._getValue(node));
    }

    if (node.type === 'value') {
      this._pushNode(node);
    }
  }

  _popNode(): ExpressionNode {
    return this._nodeStack.pop();
  }

  _pushNode(node: ExpressionNode): void {
    this._nodeStack.push(node);
  }

  _getValue(identifierNode: IdentifierNode): ExpressionNode {
    return this._globalContext[identifierNode.value] ?? identifierNode;
  }

  _setValue(identifier: string, node: ExpressionNode): void {
    this._globalContext[identifier] = node;
    this._pushNode(node);
  }
}
