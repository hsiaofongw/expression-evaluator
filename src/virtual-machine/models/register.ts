import { Injectable } from '@nestjs/common';

export type IRegister = {
  read(): Buffer;
  write(value: Buffer);
};

export type IRegisterBatchManufactureSpecification = {
  registerCounts: number;
  registerSizeByte: number;
};

@Injectable()
export class RegisterFactory {
  createMany(specs: IRegisterBatchManufactureSpecification): Register[] {
    const registers: Register[] = [];
    for (let i = 0; i < specs.registerCounts; i++) {
      registers.push(new Register(specs.registerSizeByte));
    }

    return registers;
  }
}

export class Register {
  _buffer!: Buffer;

  constructor(private _size: number) {
    this._buffer = Buffer.alloc(_size);
  }

  public read(): Buffer {
    return this._buffer.slice(this._size);
  }

  public write(value: Buffer): void {
    value.copy(this._buffer, 0, 0, this._size);
  }
}
