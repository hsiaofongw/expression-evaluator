import { Injectable } from '@nestjs/common';

export class Stack {
  _stackPointer = -1;
  _stackChunkSizeBytes = 8;

  constructor(private buffer: Buffer) {}

  pop(): Buffer {
    if (this._stackPointer === -1) {
      throw new RangeError();
    }

    return this.buffer.slice(
      this._stackPointer,
      this._stackPointer + this._stackChunkSizeBytes,
    );
  }

  push(value: Buffer): void {
    const newStackPointer = this._stackPointer + this._stackChunkSizeBytes;
    value.copy(this.buffer, newStackPointer, 0, this._stackChunkSizeBytes);
    this._stackPointer = newStackPointer;
  }
}

export type IStackManufactureSpecification = {
  stackSizeBytes: number;
};

@Injectable()
export class StackFactory {
  create(specification: IStackManufactureSpecification): Stack {
    return new Stack(Buffer.alloc(specification.stackSizeBytes));
  }
}
