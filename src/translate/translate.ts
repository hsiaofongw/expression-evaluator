/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NonTerminalNode, TerminalNode } from 'src/parser/interfaces';
import { Transform, TransformCallback } from 'stream';

type Evaluator = (node: NonTerminalNode) => void;
type EvaluatorMap = Record<string, Evaluator>;

const doNothing = (_: any) => {};

export class ExpressionTranslate extends Transform {
  _nodeStack: any[] = [];

  _evaluatorMap: EvaluatorMap = {
    'JSON -> OBJ': (n) => this._evaluate(n.children[0] as NonTerminalNode),

    'OBJ -> { KV_LIST }': (n) => {
      this._pushNode({});
      this._evaluate(n.children[1] as NonTerminalNode);
    },

    'JSON -> ARY': (n) => this._evaluate(n.children[0] as NonTerminalNode),

    'ARY -> [ VAL_LIST ]': (n) => {
      this._pushNode([]);
      this._evaluate(n.children[1] as NonTerminalNode);
    },

    'VAL -> ATOM': (n) => this._evaluate(n.children[0] as NonTerminalNode),

    'VAL -> JSON': (n) => this._evaluate(n.children[0] as NonTerminalNode),

    'ATOM -> str': (n) => {
      if (n.children[0].type === 'terminal') {
        const content = n.children[0].token.content ?? '';
        this._pushNode(content);
      }
    },

    'ATOM -> BOOL': (n) => this._evaluate(n.children[0] as NonTerminalNode),

    'ATOM -> num': (n) => {
      if (n.children[0].type === 'terminal') {
        const sNum = n.children[0].token.content ?? '0';
        let num = 0;
        if (sNum.includes('.')) {
          num = parseFloat(sNum);
        } else {
          num = parseInt(sNum);
        }
        this._pushNode(num);
      }
    },

    'ATOM -> null': (_) => this._pushNode(null),

    'VAL_LIST -> VAL VAL_LIST_E': (n) => this._appendValIntoList(n, 0, 1),

    'VAL_LIST -> eps': doNothing,

    'VAL_LIST_E -> , VAL VAL_LIST_E': (n) => this._appendValIntoList(n, 1, 2),

    'VAL_LIST_E -> eps': doNothing,

    'KV -> str : VAL': (n) => this._appendKeyValue(n, 0, 2),

    'KV_LIST -> KV KV_LIST_E': (n) => this._evaluateEveryChild(n),

    'KV_LIST -> eps': doNothing,

    'KV_LIST_E -> , KV KV_LIST_E': (n) => {
      const v1 = n.children[1] as NonTerminalNode;
      const v2 = n.children[2] as NonTerminalNode;
      this._evaluate(v1);
      this._evaluate(v2);
    },

    'KV_LIST_E -> eps': doNothing,

    'BOOL -> true': (_) => this._pushNode(true),

    'BOOL -> false': (_) => this._pushNode(false),
  };

  constructor() {
    super({ objectMode: true });
  }

  private _evaluateEveryChild(node: NonTerminalNode): void {
    node.children.forEach((child) => this._evaluate(child as NonTerminalNode));
  }

  private _pushNode(node: any): void {
    this._nodeStack.push(node);
  }

  private _popNode(): any {
    return this._nodeStack.pop();
  }

  private _evaluate(node: NonTerminalNode): void {
    const evaluator = this._evaluatorMap[node.ruleName];
    if (typeof evaluator === 'function') {
      evaluator(node);
    } else {
      console.error(`No evaluator`);
      console.error({ node });
      process.exit(1);
    }
  }

  private _appendKeyValue(
    n: NonTerminalNode,
    keyIdx: number,
    valIdx: number,
  ): void {
    const obj = this._popNode();
    const v1 = n.children[keyIdx] as TerminalNode;
    const v2 = n.children[valIdx] as NonTerminalNode;
    const key = v1.token.content;
    this._evaluate(v2);
    const val = this._popNode();
    obj[key] = val;
    this._pushNode(obj);
  }

  private _appendValIntoList(
    node: NonTerminalNode,
    valIdx: number,
    nextIdx: number,
  ): void {
    const valNode = node.children[valIdx] as NonTerminalNode;
    const nextNode = node.children[nextIdx] as NonTerminalNode;
    this._evaluate(valNode);
    const val = this._popNode();
    const ary = this._popNode() as any[];
    ary.push(val);
    this._pushNode(ary);
    this._evaluate(nextNode);
  }

  _transform(
    node: NonTerminalNode,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this._evaluate(node);
    this.push(this._nodeStack.pop());
    callback();
  }
}
