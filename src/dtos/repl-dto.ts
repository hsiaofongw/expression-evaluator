import { IREPLEnvironmentDescriptor } from 'src/interfaces';

export class REPLEnvironmentDescriptorDto
  implements IREPLEnvironmentDescriptor
{
  topicId: string;
  initialSeqNum: number;
}
