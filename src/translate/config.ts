/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
  ExpressionNode,
  ExpressionNodeEvaluator,
  FunctionNode,
  IEvaluateContext,
} from './interfaces';

class EvaluatorHelper {
  public static makeSingleValueEvaluator(
    functionName: string,
    valueFunction: (v: number) => number,
  ): ExpressionNodeEvaluator {
    return {
      match: { type: 'functionName', functionName: functionName },
      action: (node, context) => {
        context._evaluate(node.children[0]);
        const v1 = context._popNode();
        if (v1.type === 'value') {
          context._pushNode({ type: 'value', value: valueFunction(v1.value) });
        } else {
          context._pushNode({
            type: 'function',
            functionName: 'Sin',
            children: [v1],
          });
        }
      },
    };
  }
}

export const defaultEvaluator: ExpressionNodeEvaluator = {
  match: { type: 'regexp', regexp: /.+/ },
  action: (node, context) => {
    const evaluatedChidren: ExpressionNode[] = [];
    for (const child of node.children) {
      context._evaluate(child);
      const evaluated = context._popNode();
      evaluatedChidren.push(evaluated);
    }

    node.children = evaluatedChidren;

    // dont evaluate this node again,
    // since it reach here just because there no evaluator for it
    context._pushNode(node);
  },
};

export const evaluators: ExpressionNodeEvaluator[] = [
  EvaluatorHelper.makeSingleValueEvaluator('Sin', (v) => Math.sin(v)),
  EvaluatorHelper.makeSingleValueEvaluator('Cos', (v) => Math.cos(v)),
  EvaluatorHelper.makeSingleValueEvaluator('Tan', (v) => Math.tan(v)),
  EvaluatorHelper.makeSingleValueEvaluator('ArcSin', (v) => Math.asin(v)),
  EvaluatorHelper.makeSingleValueEvaluator('ArcCos', (v) => Math.acos(v)),
  EvaluatorHelper.makeSingleValueEvaluator('ArcTan', (v) => Math.atan(v)),
  EvaluatorHelper.makeSingleValueEvaluator('SinH', (v) => Math.sinh(v)),
  EvaluatorHelper.makeSingleValueEvaluator('CosH', (v) => Math.cosh(v)),
  EvaluatorHelper.makeSingleValueEvaluator('TanH', (v) => Math.tanh(v)),
  EvaluatorHelper.makeSingleValueEvaluator('Exp', (v) => Math.exp(v)),
  EvaluatorHelper.makeSingleValueEvaluator('Ln', (v) => Math.log(v)),
  EvaluatorHelper.makeSingleValueEvaluator('Lg', (v) => Math.log10(v)),
  EvaluatorHelper.makeSingleValueEvaluator('Log2', (v) => Math.log2(v)),

  {
    match: { type: 'functionName', functionName: 'Append' },
    action: (node: FunctionNode, context: IEvaluateContext) => {
      const v1 = node.children[0];
      const v2 = node.children[1];

      if (
        v1.type === 'function' &&
        v1.functionName === 'Append' &&
        v1.children.length === 0
      ) {
        // manual call Append
        context._evaluate(v2);
      } else if (v1.type === 'function' && v1.functionName !== 'Append') {
        // evaluate v2
        context._evaluate(v2);
        const evaluatedV2 = context._popNode();

        // put evaluatedV2 into v1
        const newV1: ExpressionNode = {
          type: 'function',
          functionName: v1.functionName,
          children: [...v1.children, evaluatedV2],
        };

        // evaluated v1
        context._evaluate(newV1);
      } else if (v1.type === 'function' && v1.functionName === 'Append') {
        context._evaluate(v1);
        const evaluatedV1 = context._popNode() as FunctionNode;
        node.children[0] = evaluatedV1;
        context._evaluate(node);
      } else {
        context._pushNode(node);
      }
    },
  },

  defaultEvaluator,
];
