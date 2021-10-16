import { Injectable } from '@nestjs/common';
import { VirtualMachine } from '../models/virtual-machine';

@Injectable()
export class VirtualMachineFactory {
  public create(): VirtualMachine {
    return new VirtualMachine()
  }
}
