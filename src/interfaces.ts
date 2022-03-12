export interface IREPLEnvironmentDescriptor {
  topicId: string;
  initialSeqNum: number;
}

export interface IPublicInputObject {
  topicId: string;
  exprInputString: string;
  seqNum: number;
}

export interface IPublicOutputObject {
  topicId: string;
  printContent: string;
  exprContent: string;
  seqNum: number;
}
