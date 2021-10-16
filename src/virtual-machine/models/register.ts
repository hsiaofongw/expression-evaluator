export type IRegister = {
  read(): Buffer;
  write(value: Buffer);
};

export class Register {}
