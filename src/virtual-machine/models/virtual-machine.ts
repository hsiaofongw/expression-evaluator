import { Register } from './register';
import { Stack } from './stack';

import { Injectable } from '@nestjs/common';
import { Instruction, InstructionSet } from '../instructionSet';
import { VirtualMachineSpecification } from '../specifications';

@Injectable()
export class VirtualMachineFactory {
  constructor(private spec: VirtualMachineSpecification) {}
}

export type IVirtualMachineComponents = {
  registers: Register[];
  stack: Stack;
  instructionSet: InstructionSet;
};

export class VirtualMachine {
  public readonly registers!: Register[];
  public readonly stack!: Stack;
  public readonly instructionSet!: InstructionSet;

  constructor(components: IVirtualMachineComponents) {
    this.registers = components.registers;
    this.stack = components.stack;
    this.instructionSet = components.instructionSet;
  }

  public exec(instruction: Instruction): void {
    const effect = this.instructionSet.getEffect(instruction);
    if (effect !== undefined) {
      effect(this, instruction);
    }
  }
}
