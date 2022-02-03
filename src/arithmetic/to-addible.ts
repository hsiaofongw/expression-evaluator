import { Node } from 'src/parser/interfaces';
import { Transform, TransformCallback } from 'stream';
import { ArithmeticNode, OperandNode, OperatorNode } from './interfaces';

export class ToList extends Transform {
  private _terminalSymbolIdSet!: Set<string>;
  constructor(terminalIds: Iterable<string>) {
    super({ objectMode: true });

    this._terminalSymbolIdSet = new Set<string>(terminalIds);
  }

  _transform(
    node: Node,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const terminalIds = this._terminalSymbolIdSet;
    if (node.type === 'nonTerminal') {
      const nodes: Node[] = [...node.children];
      while (nodes.length > 0) {
        const node = nodes[0];
        nodes.shift();
        if (terminalIds.has(node.symbol.id)) {
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

export class ToArithmeticTree extends Transform {
  private _leftOperand?: OperandNode | OperatorNode;
  private _operator?: OperatorNode;
  private _rightOperand?: OperandNode;
  private _state = 0;
  private _transitions: Record<
    string,
    Record<string, { action: (node: Node) => void }>
  > = {
    '0': {
      operand: {
        action: (node: Node) => {
          this._state = 1;
          this._leftOperand = { type: 'operand', node: node };
        },
      },
    },
    '1': {
      operator: {
        action: (node: Node) => {
          if (this._leftOperand) {
            this._state = 2;
            this._operator = { type: 'operator', node: node, children: [] };
          }
        },
      },
    },
    '2': {
      operand: {
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
      operator: {
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

  private _inputClassNameMap!: Record<string, string>;

  constructor(config: {
    operandSymbolIds: Iterable<string>;
    operatorSymbolIds: Iterable<string>;
  }) {
    super({ objectMode: true });
    this._state = 0;

    this._inputClassNameMap = {};
    for (const id of config.operandSymbolIds) {
      this._inputClassNameMap[id] = 'operand';
    }

    for (const id of config.operatorSymbolIds) {
      this._inputClassNameMap[id] = 'operator';
    }
  }

  _transform(
    node: Node,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const currentState = this._state.toString();
    if (this._transitions[currentState]) {
      const inputSymbolId = node.symbol.id;
      const inputClassName = this._inputClassNameMap[inputSymbolId] ?? '';
      const transition = this._transitions[currentState][inputClassName];
      if (transition) {
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
