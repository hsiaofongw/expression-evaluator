import { Node } from 'src/parser/interfaces';
import { Transform, TransformCallback } from 'stream';
import { ArithmeticNode, OperandNode, OperatorNode } from './interfaces';

export class ToAddibleList extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    node: Node,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const addibleSymbolIdSet = new Set<string>(['term', 'plus', 'minus']);
    if (node.type === 'nonTerminal') {
      const nodes: Node[] = [...node.children];
      while (nodes.length > 0) {
        const node = nodes[0];
        nodes.shift();
        if (addibleSymbolIdSet.has(node.symbol.id)) {
          this.push(node);
        } else {
          if (node.type === 'nonTerminal') {
            for (let i = 0; i < node.children.length; i++) {
              const child = node.children[node.children.length - 1 - i];
              nodes.unshift(child);
            }
          }
        }
      }
    }

    callback();
  }
}

export class ToAddTree extends Transform {
  private _leftOperand?: OperandNode | OperatorNode;
  private _operator?: OperatorNode;
  private _rightOperand?: OperandNode;
  private _state = 0;
  private _transitions: Record<
    string,
    Record<string, { action: (node: Node) => void }>
  > = {
    '0': {
      term: {
        action: (node: Node) => {
          this._state = 1;
          this._leftOperand = { type: 'operand', node: node };
        },
      },
    },
    '1': {
      plus: {
        action: (node: Node) => {
          if (this._leftOperand) {
            this._state = 2;
            this._operator = { type: 'operator', node: node, children: [] };
          }
        },
      },
      minus: {
        action: (node: Node) => {
          if (this._leftOperand) {
            this._state = 2;
            this._operator = { type: 'operator', node: node, children: [] };
          }
        },
      },
    },
    '2': {
      term: {
        action: (node: Node) => {
          if (this._leftOperand && this._operator) {
            this._state = 3;
            const rightOperand: ArithmeticNode = {
              type: 'operand',
              node: node,
            };
            this._rightOperand = rightOperand;
            this._operator.children = [this._leftOperand, rightOperand];
          }
        },
      },
    },
    '3': {
      plus: {
        action: (node: Node) => {
          if (this._leftOperand && this._operator && this._rightOperand) {
            this._state = 2;
            this._leftOperand = this._operator;
            this._operator = { type: 'operator', node: node, children: [] };
            this._rightOperand = undefined;
          }
        },
      },
      minus: {
        action: (node: Node) => {
          if (this._leftOperand && this._operator && this._rightOperand) {
            this._state = 2;
            this._leftOperand = this._operator;
            this._operator = { type: 'operator', node: node, children: [] };
            this._rightOperand = undefined;
          }
        },
      },
    },
  };

  constructor() {
    super({ objectMode: true });
    this._state = 0;
  }

  _transform(
    node: Node,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const currentState = this._state.toString();
    if (this._transitions[currentState]) {
      const inputSymbolId = node.symbol.id;
      if (this._transitions[currentState][inputSymbolId]) {
        const transition = this._transitions[currentState][inputSymbolId];
        if (transition.action) {
          const actionToTake = transition.action;
          if (typeof actionToTake === 'function') {
            actionToTake(node);
          }
        }
      }
    }
    callback();
  }

  _flush(callback: TransformCallback): void {
    if (this._operator) {
      this.push(this._operator);
    }
    callback();
  }
}
