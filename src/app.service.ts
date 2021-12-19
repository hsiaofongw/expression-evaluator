import { Injectable } from '@nestjs/common';
import { IMainService } from './types/token';
import {
  CharacterClassDetector,
  FiniteAutomata,
  ICharacterClassTable,
  ICharacterClassTableEntry,
  IFiniteAutomataConfiguration,
  IStateTable,
  IStateTransferTable,
} from './streams/fa';

@Injectable()
export class AppService implements IMainService {
  main(): void {
    const states: IStateTable = [
      { stateIdentifier: 'start', stateDescription: '初始状态' },
      { stateIdentifier: 'integer', stateDescription: '正在输入整数' },
      { stateIdentifier: 'preFloat', stateDescription: '准备输入浮点数' },
      { stateIdentifier: 'float', stateDescription: '正在输入浮点数' },
    ];

    const characters: ICharacterClassTable = [
      {
        characterClassIdentifier: 'digit',
        regularExpression: /\d/,
        description: '数字',
        example: '1234567890',
      },
      {
        characterClassIdentifier: 'whitespace',
        regularExpression: /\s/,
        description: '空格、换行、制表',
        example: ' ',
      },
      {
        characterClassIdentifier: 'symbol',
        regularExpression: /[^\d\.]/,
        description: '非数字符号',
        example: '+-*/()等',
      },
      {
        characterClassIdentifier: 'dot',
        regularExpression: /\./,
        description: '点号.',
        example: '.',
      },
    ];

    const transferTable: IStateTransferTable = [
      {
        currentStateIdentifier: 'start',
        inputCharacterClassIdentifier: 'whitespace',
        nextStateIdentifier: 'start',
      },
      {
        currentStateIdentifier: 'start',
        inputCharacterClassIdentifier: 'symbol',
        nextStateIdentifier: 'start',
      },
      {
        currentStateIdentifier: 'start',
        inputCharacterClassIdentifier: 'digit',
        nextStateIdentifier: 'integer',
      },
      {
        currentStateIdentifier: 'start',
        inputCharacterClassIdentifier: 'dot',
        nextStateIdentifier: 'preFloat',
      },
      {
        currentStateIdentifier: 'integer',
        inputCharacterClassIdentifier: 'digit',
        nextStateIdentifier: 'integer',
      },
      {
        currentStateIdentifier: 'integer',
        inputCharacterClassIdentifier: 'whitespace',
        nextStateIdentifier: 'start',
      },
      {
        currentStateIdentifier: 'integer',
        inputCharacterClassIdentifier: 'symbol',
        nextStateIdentifier: 'start',
      },
      {
        currentStateIdentifier: 'integer',
        inputCharacterClassIdentifier: 'dot',
        nextStateIdentifier: 'preFloat',
      },
      {
        currentStateIdentifier: 'preFloat',
        inputCharacterClassIdentifier: 'digit',
        nextStateIdentifier: 'float',
      },
      {
        currentStateIdentifier: 'float',
        inputCharacterClassIdentifier: 'digit',
        nextStateIdentifier: 'float',
      },
      {
        currentStateIdentifier: 'float',
        inputCharacterClassIdentifier: 'whitespace',
        nextStateIdentifier: 'start',
      },
      {
        currentStateIdentifier: 'float',
        inputCharacterClassIdentifier: 'symbol',
        nextStateIdentifier: 'start',
      },
    ];

    const configuration: IFiniteAutomataConfiguration = {
      stateTransferTable: transferTable,
    };

    const fa = new FiniteAutomata(configuration);
    const inputString = '1 + 2 * ( 3 - 4 ) - 5 / 3';
    const characterSequence: string[] = inputString.split('');
    const indexedCharacterSequence: { offset: number; character: string }[] =
      characterSequence.map((c, i) => ({ offset: i, character: c }));
    const detector = new CharacterClassDetector(characters);
    const characterObjectWithClass: {
      offset: number;
      character: string;
      characterClass?: ICharacterClassTableEntry;
    }[] = indexedCharacterSequence.map((cObject) => ({
      offset: cObject.offset,
      character: cObject.character,
      characterClass: detector.detect(cObject.character),
    }));

    // console.log(ch)
    for (const obj of characterObjectWithClass) {
      console.log(obj);
    }
  }
}
