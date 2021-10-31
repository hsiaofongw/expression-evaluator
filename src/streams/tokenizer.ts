import { Transform } from 'stream';

export class TokenizerStream extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    chunk: Buffer,
    encoding: string,
    callback: (error?: any, data?: any) => void,
  ) {
    console.log({ chunk, encoding, callback });
    const stringChunk = chunk.toString('utf-8');

    this.push(stringChunk.toUpperCase());
    callback();
  }
}
