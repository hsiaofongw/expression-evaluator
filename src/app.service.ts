import { Injectable } from '@nestjs/common';
import { IMainService } from './types/token';
import {
  CharacterClassDetector,
  FiniteAutomata,
  ICharacterClassTable,
  IFiniteAutomataConfiguration,
  IStateTable,
  IStateTransferTable,
  IOptionallyTypedCharacterObject,
  ITypedCharacterObject,
  TokenizeContext,
  IStateTransferActionTable,
  IStateTransferActionTableIndex,
} from './streams/fa';
import { strict } from 'assert';

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
      // 0
      {
        currentStateIdentifier: 'start',
        inputCharacterClassIdentifier: 'whitespace',
        nextStateIdentifier: 'start',
      },

      // 1
      {
        currentStateIdentifier: 'start',
        inputCharacterClassIdentifier: 'symbol',
        nextStateIdentifier: 'start',
      },

      // 2
      {
        currentStateIdentifier: 'start',
        inputCharacterClassIdentifier: 'digit',
        nextStateIdentifier: 'integer',
      },

      // 3
      {
        currentStateIdentifier: 'start',
        inputCharacterClassIdentifier: 'dot',
        nextStateIdentifier: 'preFloat',
      },

      // 4
      {
        currentStateIdentifier: 'start',
        inputCharacterClassIdentifier: 'endOfFile',
        nextStateIdentifier: 'start',
      },

      // 5
      {
        currentStateIdentifier: 'integer',
        inputCharacterClassIdentifier: 'digit',
        nextStateIdentifier: 'integer',
      },

      // 6
      {
        currentStateIdentifier: 'integer',
        inputCharacterClassIdentifier: 'whitespace',
        nextStateIdentifier: 'start',
      },

      // 7
      {
        currentStateIdentifier: 'integer',
        inputCharacterClassIdentifier: 'symbol',
        nextStateIdentifier: 'start',
      },

      // 8
      {
        currentStateIdentifier: 'integer',
        inputCharacterClassIdentifier: 'dot',
        nextStateIdentifier: 'preFloat',
      },

      // 9
      {
        currentStateIdentifier: 'integer',
        inputCharacterClassIdentifier: 'endOfFile',
        nextStateIdentifier: 'start',
      },

      // 10
      {
        currentStateIdentifier: 'preFloat',
        inputCharacterClassIdentifier: 'digit',
        nextStateIdentifier: 'float',
      },

      // 11
      {
        currentStateIdentifier: 'float',
        inputCharacterClassIdentifier: 'digit',
        nextStateIdentifier: 'float',
      },

      // 12
      {
        currentStateIdentifier: 'float',
        inputCharacterClassIdentifier: 'whitespace',
        nextStateIdentifier: 'start',
      },

      // 13
      {
        currentStateIdentifier: 'float',
        inputCharacterClassIdentifier: 'symbol',
        nextStateIdentifier: 'start',
      },

      // 14
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

    const characterObjectWithClass: IOptionallyTypedCharacterObject[] =
      indexedCharacterSequence.map((cObject) => ({
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

    const charObjects =
      characterObjectWithClass as any as ITypedCharacterObject[];

    let fa = new FiniteAutomata(configuration);
    const faList: FiniteAutomata[] = new Array<FiniteAutomata>();
    fa = fa.initialize('start');
    faList.push(fa);
    for (const charObject of charObjects) {
      fa = fa.feed(charObject.characterClass.characterClassIdentifier);
      faList.push(fa);
    }

    const actionTable: IStateTransferActionTable = [
      // 0
      {
        currentStateIdentifier: transferTable[0].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[0].inputCharacterClassIdentifier,
        action: (context) => {
          context.popCharacterObject();
        },
      },

      // 1
      {
        currentStateIdentifier: transferTable[1].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[1].inputCharacterClassIdentifier,
        action: (context) => {
          context.createOneNewToken();
          const charObject = context.popCharacterObject();
          context.appendCharacterObjectToCurrentToken(charObject);
          context.saveCurrentToken();
        },
      },

      // 2
      {
        currentStateIdentifier: transferTable[2].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[2].inputCharacterClassIdentifier,
        action: (context) => {
          context.createOneNewToken();
          const charObject = context.popCharacterObject();
          context.appendCharacterObjectToCurrentToken(charObject);
        },
      },

      // 3
      {
        currentStateIdentifier: transferTable[3].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[3].inputCharacterClassIdentifier,
        action: (context) => {
          context.createOneNewToken();
          const charObject = context.popCharacterObject();
          context.appendCharacterObjectToCurrentToken(charObject);
        },
      },

      // 4
      {
        currentStateIdentifier: transferTable[4].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[4].inputCharacterClassIdentifier,
        action: (context) => {
          context.popCharacterObject();
          context.saveCurrentToken();
        },
      },

      // 5
      {
        currentStateIdentifier: transferTable[5].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[5].inputCharacterClassIdentifier,
        action: (context) => {
          const charObject = context.popCharacterObject();
          context.appendCharacterObjectToCurrentToken(charObject);
        },
      },

      // 6
      {
        currentStateIdentifier: transferTable[6].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[6].inputCharacterClassIdentifier,
        action: (context) => {
          context.popCharacterObject();
          context.saveCurrentToken();
        },
      },

      // 7
      {
        currentStateIdentifier: transferTable[7].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[7].inputCharacterClassIdentifier,
        action: (context) => {
          // 保存当前 buffer 的数字 token
          context.saveCurrentToken();

          // 创建一个新 token buffer 用于存放符号
          context.createOneNewToken();

          // 读取输入缓冲区的符号
          const charObject = context.popCharacterObject();

          // 将缓冲区的符号存入 token buffer
          context.appendCharacterObjectToCurrentToken(charObject);

          // 保存当前 token
          context.saveCurrentToken();
        },
      },

      // 8
      {
        currentStateIdentifier: transferTable[8].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[8].inputCharacterClassIdentifier,
        action: (context) => {
          const charObject = context.popCharacterObject();
          context.appendCharacterObjectToCurrentToken(charObject);
        },
      },

      // 9
      {
        currentStateIdentifier: transferTable[9].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[9].inputCharacterClassIdentifier,
        action: (context) => {
          context.popCharacterObject();
          context.saveCurrentToken();
        },
      },

      // 10
      {
        currentStateIdentifier: transferTable[10].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[10].inputCharacterClassIdentifier,
        action: (context) => {
          const charObject = context.popCharacterObject();
          context.appendCharacterObjectToCurrentToken(charObject);
        },
      },

      // 11
      {
        currentStateIdentifier: transferTable[11].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[11].inputCharacterClassIdentifier,
        action: (context) => {
          const charObject = context.popCharacterObject();
          context.appendCharacterObjectToCurrentToken(charObject);
        },
      },

      // 12
      {
        currentStateIdentifier: transferTable[12].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[12].inputCharacterClassIdentifier,
        action: (context) => {
          context.popCharacterObject();
          context.saveCurrentToken();
        },
      },

      // 13
      {
        currentStateIdentifier: transferTable[13].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[13].inputCharacterClassIdentifier,
        action: (context) => {
          context.saveCurrentToken();
          const charObject = context.popCharacterObject();
          context.appendCharacterObjectToCurrentToken(charObject);
          context.saveCurrentToken();
        },
      },

      // 14
      {
        currentStateIdentifier: transferTable[14].currentStateIdentifier,
        inputCharacterClassIdentifier:
          transferTable[14].inputCharacterClassIdentifier,
        action: (context) => {
          context.popCharacterObject();
          context.saveCurrentToken();
        },
      },
    ];

    const actionTableIndex: IStateTransferActionTableIndex = {};
    for (const ent of actionTable) {
      if (actionTableIndex[ent.currentStateIdentifier] === undefined) {
        actionTableIndex[ent.currentStateIdentifier] = {};
      }

      actionTableIndex[ent.currentStateIdentifier][
        ent.inputCharacterClassIdentifier
      ] = ent.action;
    }

    const tokenizeContext = new TokenizeContext(charObjects);
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

      const currentStateIdentifier = prevFa.getStateIdentifier();
      const inputCharacterClassIdentifier =
        inputCharObj.characterClass.characterClassIdentifier;

      const actionF =
        actionTableIndex[currentStateIdentifier][inputCharacterClassIdentifier];
      strict.notStrictEqual(actionF, undefined);

      actionF(tokenizeContext);
    }

    // console.log(tokenizeContext.tokens);
    for (const token of tokenizeContext.tokens) {
      console.log(token);
    }
  }
}
