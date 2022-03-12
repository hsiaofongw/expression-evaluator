import { IPublicInputObject, IPublicOutputObject } from 'src/interfaces';

export class PublicInputObjectDto implements IPublicInputObject {
  topicId: string;
  exprInputString: string;
  seqNum: number;
}

export class PublicOutputObjectDto implements IPublicOutputObject {
  topicId: string;
  printContent: string;
  exprContent: string;
  seqNum: number;
}
