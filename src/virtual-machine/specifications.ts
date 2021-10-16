import { Injectable } from '@nestjs/common';
import { InstructionSet } from './instructionSet';

@Injectable()
export class VirtualMachineSpecification {
  registerSizeBytes: number;
  registersCount: number;
  initialStackSizeBytes: number;
  instructionSet: InstructionSet;
}

export class DefaultVirtualMachineSpecification
  implements VirtualMachineSpecification
{
  registerSizeBytes = 4;
  registersCount = 32;
  initialStackSizeBytes = 1024 * 1024;

  constructor(public instructionSet: InstructionSet) {}
}
