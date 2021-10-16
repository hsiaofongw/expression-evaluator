import { Injectable } from '@nestjs/common';

export class Stack {}

export type IStackManufactureSpecification = {
  stackSizeBytes: number;
};

@Injectable()
export class StackFactory {
  create(specification: IStackManufactureSpecification): Stack {
    return new Stack();
  }
}
