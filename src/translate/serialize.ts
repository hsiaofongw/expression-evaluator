import { ExprHelper } from 'src/helpers/expr-helpers';
import { Transform, TransformCallback } from 'stream';
import { EvaluateResultObject, Expr } from './interfaces';

export class ExpressionNodeSerialize extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    evaluateResult: EvaluateResultObject,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const exprString = ExprHelper.nodeToString(evaluateResult.result);
    const nextSeq = evaluateResult.seqNum + 1;
    const outputString = `\nOut[${evaluateResult.seqNum}]= ${exprString}\n\nIn[${nextSeq}]:= `;
    this.push(outputString);
    callback();
  }
}

export class MinimalNodeSerialize extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    chunk: EvaluateResultObject,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.push(ExprHelper.nodeToString(chunk.result));
    callback();
  }
}
