import { Transform, TransformCallback } from 'stream';
import { defaultEvaluator, builtInEvaluators } from './config';
import {
  ExpressionNode,
  ExpressionNodeEvaluator,
  IdentifierNode,
  IEvaluateContext,
  NamedEvaluator,
} from './interfaces';

export class Evaluate extends Transform implements IEvaluateContext {
  private _nodeStack: ExpressionNode[] = [];
  private _globalContext: Record<string, ExpressionNode> = {};
  private _outputHistory: ExpressionNode[] = [];
  private _builtInEvaluatorMap: Record<string, ExpressionNodeEvaluator> = {};

  constructor() {
    super({ objectMode: true });

    this._nodeStack = [];
    this._globalContext = {};

    const namedBuiltInEvaluators: NamedEvaluator[] = builtInEvaluators.filter(
      (eva) => eva.match.type === 'functionName',
    ) as NamedEvaluator[];
    for (const evaluator of namedBuiltInEvaluators) {
      this._builtInEvaluatorMap[evaluator.match.functionName] = evaluator;
    }
  }

  public getOutputHistoryLength(): number {
    return this._outputHistory.length;
  }

  private _getEvaluatorForFunctionNode(
    functionName: string,
  ): ExpressionNodeEvaluator {
    return this._builtInEvaluatorMap[functionName] ?? defaultEvaluator;
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
    } else if (node.type === 'identifier') {
      this._pushNode(this._getValue(node));
    } else {
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

  _getHistory(idx: number): ExpressionNode {
    return this._outputHistory[idx];
  }

  _getHistoryLength(): number {
    return this._outputHistory.length;
  }

  _getMostRecentHistory(): ExpressionNode {
    return this._outputHistory[this._outputHistory.length - 1];
  }
}
