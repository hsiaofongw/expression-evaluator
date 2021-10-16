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
    return [];
  }
}

export class Register {}
