import { ExprHelper } from 'src/helpers/expr-helpers';
import { Transform, TransformCallback } from 'stream';
import { Expr } from './interfaces';

export class ExpressionNodeSerialize extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    node: Expr,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.push(ExprHelper.nodeToString(node));
    callback();
  }
}
