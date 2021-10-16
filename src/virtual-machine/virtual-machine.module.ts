import { Module } from '@nestjs/common';
import { DefaultInstructionSet, InstructionSet } from './instructionSet';
import { RegisterFactory } from './models/register';
import { StackFactory } from './models/stack';
import { VirtualMachineFactory } from './models/virtual-machine';
import {
  DefaultVirtualMachineSpecification,
  VirtualMachineSpecification,
} from './specifications';

@Module({
  providers: [
    { provide: InstructionSet, useClass: DefaultInstructionSet },
    {
      provide: VirtualMachineSpecification,
      useClass: DefaultVirtualMachineSpecification,
    },
    VirtualMachineFactory,
    StackFactory,
    RegisterFactory,
  ],
})
export class VirtualMachineModule {}
