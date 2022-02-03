import { Transform, TransformCallback } from 'stream';
import { EvaluateNode, NumericValueNode } from './interfaces';
type Evaluator = (node: EvaluateNode) => void;
type EvaluatorMap = Record<EvaluateNode['type'], Evaluator>;

export class Evaluate extends Transform {
  _valueStack: NumericValueNode[] = [];
  _registers: number[] = [];

  _evaluatorMap: EvaluatorMap = {
    plus: (node: EvaluateNode) => {
      if (node.type === 'plus') {
        const v1 = node.children[0];
        const v2 = node.children[1];
        this._getEvaluator(v1.type)(v1);
        this._getEvaluator(v2.type)(v2);

        this._pop(1); // POP R2
        this._pop(0); // POP R1
        this._add(0, 1); // ADD R1, R2
        this._push(0); // PUSH R1
      }
    },
    minus: (node: EvaluateNode) => {
      if (node.type === 'minus') {
        const v1 = node.children[0];
        const v2 = node.children[1];
        this._getEvaluator(v1.type)(v1);
        this._getEvaluator(v2.type)(v2);

        this._pop(1); // POP R2
        this._pop(0); // POP R1
        this._sub(0, 1); // SUB R1, R2
        this._push(0); // PUSH R1
      }
    },
    times: (node: EvaluateNode) => {
      if (node.type === 'times') {
        const v1 = node.children[0];
        const v2 = node.children[1];
        this._getEvaluator(v1.type)(v1);
        this._getEvaluator(v2.type)(v2);

        this._pop(1); // POP R2
        this._pop(0); // POP R1
        this._times(0, 1); // SUB R1, R2
        this._push(0); // PUSH R1
      }
    },
    divide: (node: EvaluateNode) => {
      if (node.type === 'divide') {
        const v1 = node.children[0];
        const v2 = node.children[1];
        this._getEvaluator(v1.type)(v1);
        this._getEvaluator(v2.type)(v2);

        this._pop(1); // POP R2
        this._pop(0); // POP R1
        this._divide(0, 1); // SUB R1, R2
        this._push(0); // PUSH R1
      }
    },
    node: (node: EvaluateNode) => {
      if (node.type === 'node') {
        const contentNode = node.node;
        if (contentNode.type === 'terminal') {
          const token = contentNode.token;
          if (token) {
            const content = token.content;
            if (content) {
              const value = parseFloat(content);
              this._mov(0, value); // MOV R1, $value
              this._push(0); // PUSH R1
            }
          }
        }
      }
    },
    value: (node: EvaluateNode) => {
      if (node.type === 'value') {
        const value = node.value;
        this._mov(0, value); // MOV, R1, $value
        this._push(0); // PUSH R1
      }
    },
  };

  private _getEvaluator(name: EvaluateNode['type']): Evaluator {
    return this._evaluatorMap[name];
  }

  private _mov(registerId: number, value: number): void {
    console.log(`MOV R${registerId}, \$${value}`);
    this._registers[registerId] = value;
  }

  private _pop(registerId: number): void {
    console.log(`POP R${registerId}`);
    const valueNode = this._valueStack.pop() as NumericValueNode;
    this._registers[registerId] = valueNode.value;
  }

  private _add(register1Id: number, register2Id: number): void {
    console.log(`ADD R${register1Id}, R${register2Id}`);
    const v1 = this._registers[register1Id];
    const v2 = this._registers[register2Id];
    const result = v1 + v2;
    this._registers[register1Id] = result;
  }

  private _sub(register1Id: number, register2Id: number): void {
    console.log(`SUB R${register1Id}, R${register2Id}`);
    const v1 = this._registers[register1Id];
    const v2 = this._registers[register2Id];
    const result = v1 - v2;
    this._registers[register1Id] = result;
  }

  private _push(registerId: number): void {
    console.log(`PUSH R${registerId}`);
    const value = this._registers[registerId];
    this._valueStack.push({ type: 'value', value: value });
  }

  private _times(register1Id: number, register2Id: number): void {
    console.log(`MUL R${register1Id}, R${register2Id}`);
    const v1 = this._registers[register1Id];
    const v2 = this._registers[register2Id];
    const result = v1 * v2;
    this._registers[register1Id] = result;
  }

  private _divide(register1Id: number, register2Id: number): void {
    console.log(`DIV R${register1Id}, R${register2Id}`);
    const v1 = this._registers[register1Id];
    const v2 = this._registers[register2Id];
    const result = v1 / v2;
    this._registers[register1Id] = result;
  }

  constructor() {
    super({ objectMode: true });
  }

  _transform(
    node: EvaluateNode,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    console.log('input');
    console.log(node);
    this._getEvaluator(node.type)(node);
    if (this._valueStack.length) {
      const valueNode = this._valueStack.pop() as NumericValueNode;
      this.push(valueNode.value);
    }
    callback();
  }
}
