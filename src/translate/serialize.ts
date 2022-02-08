import { Transform, TransformCallback } from 'stream';
import { ExpressionNode } from './interfaces';

export class ExpressionNodeSerialize extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  private _nodeToString(node: ExpressionNode): string {
    if (node.nodeType === 'terminal') {
      return node.value.toString();
    } else {
      const childrenDisplay = node.children
        .map((_n) => this._nodeToString(_n))
        .join(', ');
      return `${this._nodeToString(node.head)}[${childrenDisplay}]`;
    }
  }

  _transform(
    node: ExpressionNode,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.push(this._nodeToString(node));
    callback();
  }
}
