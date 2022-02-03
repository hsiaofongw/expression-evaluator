import { Node } from 'src/parser/interfaces';
import { Transform, TransformCallback } from 'stream';

export class SelectSymbol extends Transform {
  private _matchIdSet!: Set<string>;
  private _processStream!: Transform;

  constructor(config: {
    matchIds: Iterable<string>;
    processStream: Transform;
  }) {
    super({ objectMode: true });

    this._matchIdSet = new Set<string>(config.matchIds);
    this._processStream = config.processStream;
    this._processStream.on('data', (processedDatum) => {
      this.push(processedDatum);
    });
  }

  _transform(
    node: Node,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const symbolId = node.symbol.id;
    if (this._matchIdSet.has(symbolId)) {
      this._processStream.write(node);
    } else {
      this.push(node);
    }
  }

  _flush(callback: TransformCallback): void {
    this._processStream.end();
  }
}
