import { Register, RegisterFactory } from './register';
import { Stack, StackFactory } from './stack';

import { Injectable } from '@nestjs/common';
import { Instruction, InstructionSet } from '../instructionSet';
import { VirtualMachineSpecification } from '../specifications';

export type IVirtualMachineComponents = {
  registers: Register[];
  stack: Stack;
  instructionSet: InstructionSet;
};

@Injectable()
export class VirtualMachineFactory {
  constructor(
    private spec: VirtualMachineSpecification,
    private resigerFactory: RegisterFactory,
    private stackFactory: StackFactory,
  ) {}

  private _buildRegisters(): Register[] {
    return this.resigerFactory.createMany({
      registerCounts: this.spec.registersCount,
      registerSizeByte: this.spec.registerSizeBytes,
    });
  }

  private _buildStack(): Stack {
    return this.stackFactory.create({
      stackSizeBytes: this.spec.initialStackSizeBytes,
    });
  }

  public create(): VirtualMachine {
    const components: IVirtualMachineComponents = {
      registers: this._buildRegisters(),
      stack: this._buildStack(),
      instructionSet: this.spec.instructionSet,
    };

    return new VirtualMachine(components);
  }
}

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
