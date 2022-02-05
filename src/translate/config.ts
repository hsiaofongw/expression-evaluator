/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import {
  ExpressionNode,
  ExpressionNodeEvaluator,
  FunctionNode,
  IEvaluateContext,
} from './interfaces';

class EvaluatorHelper {
  /** compare two node, no evaluate, just direct compare */
  public static twoNodeEqualQ(a: ExpressionNode, b: ExpressionNode): boolean {
    const compareList: ExpressionNode[][] = [[a, b]];
    while (compareList.length) {
      const pair = compareList.pop() as any as ExpressionNode[];
      const lhs = pair[0];
      const rhs = pair[1];

      if (lhs.type !== rhs.type) {
        return false;
      } else if (lhs.type === 'function' && rhs.type === 'function') {
        if (lhs.functionName !== rhs.functionName) {
          // 函数名不一样
          return false;
        } else if (
          lhs.functionName === rhs.functionName &&
          lhs.children.length !== rhs.children.length
        ) {
          // 函数输入个数不一样
          return false;
        } else {
          // 函数名一样，函数个数也一样，对比 chilren
          for (let i = 0; i < lhs.children.length; i++) {
            compareList.push([lhs.children[i], rhs.children[i]]);
          }
        }
      } else if (lhs.type === 'boolean' && rhs.type === 'boolean') {
        if (lhs.value !== rhs.value) {
          return false;
        }

        // 如果相等，不要退出，可能还有其它项需要比较（也就是说 compareList 非空），下同。
      } else if (lhs.type === 'identifier' && rhs.type === 'identifier') {
        if (lhs.value !== rhs.value) {
          return false;
        }
      } else if (lhs.type === 'value' && rhs.type === 'value') {
        if (lhs.value !== rhs.value) {
          return false;
        }
      } else {
      }
    }

    return true;
  }

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

  public static makeTwoInputValueFunction(
    functionName: string,
    valueFunction: (v1: number, v2: number) => number,
  ): ExpressionNodeEvaluator {
    return EvaluatorHelper.makeTwoInputNodeFunction(functionName, (v1, v2) => {
      return { type: 'value', value: valueFunction(v1, v2) };
    });
  }

  public static makeTwoInputNodeFunction(
    functionName: string,
    nodeFunction: (v1: number, v2: number) => ExpressionNode,
  ): ExpressionNodeEvaluator {
    return {
      match: { type: 'functionName', functionName: functionName },
      action: (node, context) => {
        const v1 = node.children[0];
        const v2 = node.children[1];

        if (v1 !== undefined && v2 !== undefined) {
          context._evaluate(v1);
          context._evaluate(v2);
          const evaluatedV2 = context._popNode();
          const evaluatedV1 = context._popNode();
          node.children[0] = evaluatedV1;
          node.children[1] = evaluatedV2;

          if (
            node.children[0].type === 'value' &&
            node.children[1].type === 'value'
          ) {
            context._pushNode(
              nodeFunction(node.children[0].value, node.children[1].value),
            );
          } else {
            context._pushNode(node);
          }
        } else {
          console.error('Incorrect parameters count');
          console.error(node);
          process.exit(1);
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

  EvaluatorHelper.makeTwoInputValueFunction('Plus', (v1, v2) => v1 + v2),
  EvaluatorHelper.makeTwoInputValueFunction('Minus', (v1, v2) => v1 - v2),
  EvaluatorHelper.makeTwoInputValueFunction('Times', (v1, v2) => v1 * v2),
  EvaluatorHelper.makeTwoInputValueFunction('Divide', (v1, v2) => v1 / v2),

  EvaluatorHelper.makeTwoInputNodeFunction('GreaterThan', (v1, v2) => {
    return { type: 'boolean', value: v1 > v2 };
  }),
  EvaluatorHelper.makeTwoInputNodeFunction('GreaterThanOrEqual', (v1, v2) => {
    return { type: 'boolean', value: v1 >= v2 };
  }),
  EvaluatorHelper.makeTwoInputNodeFunction('LessThan', (v1, v2) => {
    return { type: 'boolean', value: v1 < v2 };
  }),
  EvaluatorHelper.makeTwoInputNodeFunction('LessThanOrEqual', (v1, v2) => {
    return { type: 'boolean', value: v1 <= v2 };
  }),

  {
    match: { type: 'functionName', functionName: 'EqualQ' },
    action: (node: FunctionNode, context: IEvaluateContext) => {
      if (node.children.length === 2) {
        context._evaluate(node.children[0]);
        context._evaluate(node.children[1]);
        node.children[1] = context._popNode();
        node.children[0] = context._popNode();

        context._pushNode({
          type: 'boolean',
          value: EvaluatorHelper.twoNodeEqualQ(
            node.children[0],
            node.children[1],
          ),
        });
        return;
      }

      context._pushNode(node);
    },
  },

  {
    match: { type: 'functionName', functionName: 'GetHead' },
    action: (node: FunctionNode, context: IEvaluateContext) => {
      if (node.children[0] !== undefined) {
        context._evaluate(node.children[0]);
        const v1 = context._popNode();
        if (v1.type === 'function') {
          context._pushNode({ type: 'identifier', value: v1.functionName });
          return;
        }
      }

      context._pushNode(node);
    },
  },

  {
    match: { type: 'functionName', functionName: 'GetParametersList' },
    action: (node: FunctionNode, context: IEvaluateContext) => {
      if (node.children.length === 0) {
        context._pushNode(node);
        return;
      }

      const v1 = node.children[0];
      if (v1.type !== 'function') {
        context._pushNode(node);
        return;
      }

      const parameters: ExpressionNode[] = [];
      for (const param of v1.children) {
        context._evaluate(param);
        parameters.push(context._popNode());
      }

      context._pushNode({
        type: 'function',
        functionName: 'List',
        children: parameters,
      });
    },
  },

  {
    match: { type: 'functionName', functionName: 'Take' },
    action: (node, context) => {
      if (node.children.length === 2) {
        const v1 = node.children[0];
        const v2 = node.children[1];
        context._evaluate(v1);
        context._evaluate(v2);

        const nv2 = context._popNode();
        const nv1 = context._popNode();

        if (nv1.type === 'function' && nv2.type === 'value') {
          const idx = parseInt(nv2.value.toFixed(0));
          if (idx >= 0 && idx < nv1.children.length) {
            const element = nv1.children[idx];
            context._evaluate(element);
            return;
          }
        }
      }

      context._pushNode(node);
    },
  },

  {
    match: { type: 'functionName', functionName: 'Out' },
    action: (node: FunctionNode, context: IEvaluateContext) => {
      const historyLength = context._getHistoryLength();
      // 无 history
      if (historyLength === 0) {
        context._pushNode(node);
        return;
      }

      // 有 history, 有参数
      if (node.children.length) {
        const v1 = node.children[0];
        context._evaluate(v1);
        const evaluatedV1 = context._popNode();
        node.children[0] = evaluatedV1;

        // 非 number 类型
        if (evaluatedV1.type !== 'value') {
          context._pushNode(node);
          return;
        }

        // 负数
        const requestedIdx = evaluatedV1.value;
        if (requestedIdx < 0) {
          context._pushNode(node);
          return;
        }

        // 数组越界
        if (requestedIdx >= historyLength) {
          context._pushNode(node);
          return;
        }

        // 非整数
        const requestedIdxInt = parseInt(requestedIdx.toFixed(0));
        if (requestedIdx !== requestedIdxInt) {
          context._pushNode(node);
          return;
        }

        const history = context._getHistory(requestedIdx);
        context._pushNode(history);
        return;
      } else {
        // 无参数
        const history = context._getMostRecentHistory();
        context._pushNode(history);
        return;
      }
    },
  },

  {
    match: { type: 'functionName', functionName: 'Append' },
    action: (node: FunctionNode, context: IEvaluateContext) => {
      const v1 = node.children[0];

      if (v1.type === 'function') {
        // 对 v2 求值
        context._evaluate(node.children[1]);
        node.children[1] = context._popNode();

        // v2 加入 v1 的列表
        const newParams = [...v1.children, node.children[1]];
        v1.children = newParams;

        // 再对 v1 求值
        context._evaluate(v1);
      } else {
        context._pushNode(node);
      }
    },
  },

  defaultEvaluator,
];
