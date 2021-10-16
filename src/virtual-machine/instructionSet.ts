import { Injectable } from '@nestjs/common';
import { VirtualMachine } from './models/virtual-machine';

export type Instruction = string;

export type IInstructionEffect = (
  vm: VirtualMachine,
  instruction: Instruction,
) => void;

@Injectable()
export abstract class InstructionSet {
  abstract getEffect(instuction: Instruction): IInstructionEffect | undefined;
}

@Injectable()
export class DefaultInstructionSet implements InstructionSet {
  getEffect(instruction: Instruction): IInstructionEffect | undefined {
    if (instruction.length === 0) {
      return undefined;
    }

    return undefined;
  }
}
