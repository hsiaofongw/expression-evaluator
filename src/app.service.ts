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
import { strict } from 'assert';
import { zip } from 'rxjs';

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
        regularExpression: /[^\d\.\w]/,
        description: '非数字符号',
        example: '+-*/()等',
      },
      {
        characterClassIdentifier: 'dot',
        regularExpression: /\./,
        description: '点号.',
        example: '.',
      },
      {
        characterClassIdentifier: 'endOfFile',
        regularExpression: /^$/,
        description: '文件终结符',
        example: '',
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
        currentStateIdentifier: 'start',
        inputCharacterClassIdentifier: 'endOfFile',
        nextStateIdentifier: 'start',
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
        currentStateIdentifier: 'integer',
        inputCharacterClassIdentifier: 'endOfFile',
        nextStateIdentifier: 'start',
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
      {
        currentStateIdentifier: 'float',
        inputCharacterClassIdentifier: 'endOfFile',
        nextStateIdentifier: 'start',
      },
    ];

    const configuration: IFiniteAutomataConfiguration = {
      stateTransferTable: transferTable,
    };

    // const fa = new FiniteAutomata(configuration);

    const inputString = '1 + 2 * ( 3 - 4 ) - 5 / 3 + 2.259';

    const characterSequence: string[] = inputString.split('');

    const indexedCharacterSequence: { offset: number; character: string }[] =
      characterSequence.map((c, i) => ({ offset: i, character: c }));

    indexedCharacterSequence.push({
      offset: indexedCharacterSequence.length,
      character: '',
    });

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

    // 确保每一个字符都检测出了 class
    strict.strictEqual(
      characterObjectWithClass.find(
        (cObj) => cObj.characterClass === undefined,
      ),
      undefined,
    );

    const charObjects = characterObjectWithClass as any as {
      offset: number;
      character: string;
      characterClass: ICharacterClassTableEntry;
    }[];

    let fa = new FiniteAutomata(configuration);
    const faList: FiniteAutomata[] = new Array<FiniteAutomata>();
    fa = fa.initialize('start');
    faList.push(fa);
    for (const charObject of charObjects) {
      fa = fa.feed(charObject.characterClass.characterClassIdentifier);
      faList.push(fa);
    }

    // for (const obj of charObjects) {
    //   console.log(obj);
    // }

    // zip(charObjects, faList).subscribe((ary) => {
    //   console.log(ary);
    // });

    for (let i = 0; i < faList.length - 1; i++) {
      const prevFa = faList[i];
      const currFa = faList[i + 1];
      const inputCharObj = charObjects[i];
      const transition = `${
        inputCharObj.character
      }: ${prevFa.getStateIdentifier()} + ${
        inputCharObj.characterClass.characterClassIdentifier
      } -> ${currFa.getStateIdentifier()}`;
      console.log(transition);
    }
  }
}
