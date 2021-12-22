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
  IRawToken,
  IAtomicToken,
  ITokenClassDefinition,
  ITypedToken,
  SemanticRule,
  SemanticUnit,
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

    const inputString = '124 + 456 * ( 3.178 - 4965.0 * .145 ) - 5 / 3 + 2.259';

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

    const tokens: IRawToken[] = tokenizeContext.tokens
      .filter((token) => token !== undefined)
      .filter((token) => token.characterObjects !== undefined)
      .filter((token) => Array.isArray(token.characterObjects))
      .filter((token) => token.characterObjects.length)
      .filter((token) =>
        token.characterObjects.every((charObject) => charObject.character),
      );

    const atomicTokens: IAtomicToken[] = new Array<IAtomicToken>();
    for (const token of tokens) {
      const atomicToken: IAtomicToken = {
        offset: token.characterObjects[0].offset,
        content: token.characterObjects
          .map((charObj) => charObj.character)
          .join(''),
      };
      atomicTokens.push(atomicToken);
    }

    // token 类别定义
    const tokenClassDefinitions: ITokenClassDefinition[] = [
      {
        tokenClassName: 'number',
        description: '数',
        regularExpressionDefinitions: [/^\d+$/, /^\d*\.\d+$/],
      },
      {
        tokenClassName: 'plus',
        description: '加号',
        regularExpressionDefinitions: /^\+$/,
      },
      {
        tokenClassName: 'minus',
        description: '减号或者负号',
        regularExpressionDefinitions: /^\-$/,
      },
      {
        tokenClassName: 'times',
        description: '乘号',
        regularExpressionDefinitions: /^\*$/,
      },
      {
        tokenClassName: 'divideBy',
        description: '除号',
        regularExpressionDefinitions: /^\/$/,
      },
      {
        tokenClassName: 'leftParenthesis',
        description: '左括号',
        regularExpressionDefinitions: /^\($/,
      },
      {
        tokenClassName: 'rightParenthesis',
        description: '右括号',
        regularExpressionDefinitions: /^\)$/,
      },
    ];

    const typedToknes: ITypedToken[] = new Array<ITypedToken>();
    const tokenTypingLogs: string[] = [];
    for (const atomicToken of atomicTokens) {
      tokenTypingLogs.push(`testing: ${atomicToken.content}`);
      let tokenTypeName: string | undefined = undefined;
      for (const definition of tokenClassDefinitions) {
        if (Array.isArray(definition.regularExpressionDefinitions)) {
          for (const regex of definition.regularExpressionDefinitions) {
            if (regex.test(atomicToken.content)) {
              tokenTypeName = definition.tokenClassName;
            }
          }
        } else {
          if (
            definition.regularExpressionDefinitions.test(atomicToken.content)
          ) {
            tokenTypeName = definition.tokenClassName;
          }
        }
      }

      tokenTypingLogs.push(`got: ${tokenTypeName}`);

      try {
        strict.notStrictEqual(tokenTypeName, undefined);
      } catch (error) {
        for (const log of tokenTypingLogs) {
          console.debug(log);
        }
        console.error(error);
      }

      const typedToken: ITypedToken = {
        offset: atomicToken.offset,
        content: atomicToken.content,
        tokenClassName: tokenTypeName,
      };

      typedToknes.push(typedToken);
    }

    for (const typedToken of typedToknes) {
      console.log(typedToken);
    }

    // 要进行语法分析，先定义语法规则

    // number, 数
    const numberUnit: SemanticUnit = {
      type: 'terminal',
      name: 'number',
    };

    // plus, 加号
    const plusUnit: SemanticUnit = {
      type: 'terminal',
      name: 'plus',
    };

    // minus, 减号
    const minusUnit: SemanticUnit = {
      type: 'terminal',
      name: 'minus',
    };

    // times, 乘号，或者星号
    const timesUnit: SemanticUnit = {
      type: 'terminal',
      name: 'times',
    };

    // divideBy, 除号
    const divideByUnit: SemanticUnit = {
      type: 'terminal',
      name: 'divideBy',
    };

    // leftParenthesis, 左括号（半角）
    const leftParenthesisUnit: SemanticUnit = {
      type: 'terminal',
      name: 'leftParenthesis',
    };

    // rightParenthesis, 右括号（半角）
    const rightParenthesisUnit: SemanticUnit = {
      type: 'terminal',
      name: 'rightParenthesis',
    };

    // 终结符定义完毕

    // 下面定义非终结符

    // 数表达式，包括正数和负数，以及括号嵌套
    const numberExpressionUnit: SemanticUnit = {
      type: 'nonTerminal',
      name: 'numberExpression',
    };

    // 倍数表达式，倍数主要是拿来相乘的
    const factorExpressionUnit: SemanticUnit = {
      type: 'nonTerminal',
      name: 'facterExpression',
    };

    // 一般表达式，加减法之类的
    const expressionUnit: SemanticUnit = {
      type: 'nonTerminal',
      name: 'expression',
    };

    // 倍数操作符，例如乘号和除以号
    const factorOperatorUnit: SemanticUnit = {
      type: 'nonTerminal',
      name: 'factorOperator',
    };

    // 加减操作符，例如加号和减号
    const addOrSubtractOperatorUnit: SemanticUnit = {
      type: 'nonTerminal',
      name: 'addOrSubtractOperator',
    };

    // 非终结符定义完毕

    // 下面定义生成式
    // 自底向上
    const semanticRules: SemanticRule[] = [
      // 规则 0: 一个 number 是一个 numberExpression
      {
        head: numberExpressionUnit,
        body: [numberUnit],
      },

      // 规则 1: (-numberExpression) 是一个 numberExpression（负数）
      {
        head: numberExpressionUnit,
        body: [
          leftParenthesisUnit,
          minusUnit,
          numberExpressionUnit,
          rightParenthesisUnit,
        ],
      },

      // 规则 2: (numberExpression) 是一个 numberExpression（正、负数的括号嵌套）
      {
        head: numberExpressionUnit,
        body: [leftParenthesisUnit, numberExpressionUnit, rightParenthesisUnit],
      },

      // 规则 3: 乘号可看做一个倍数操作符
      {
        head: factorOperatorUnit,
        body: [timesUnit],
      },

      // 规则 4: 除以号可看做一个倍数操作符
      {
        head: factorOperatorUnit,
        body: [divideByUnit],
      },

      // 规则 5: 加号可看做一个加减操作符
      {
        head: addOrSubtractOperatorUnit,
        body: [plusUnit],
      },

      // 规则 6: 减号可看作一个加减运算符
      {
        head: addOrSubtractOperatorUnit,
        body: [minusUnit],
      },

      // 规则 7: 一个 numberExpression 是一个 factorExpression
      {
        head: factorExpressionUnit,
        body: [numberExpressionUnit],
      },

      // 规则 8: 一个 factorExpression 嵌套括号之后，还是一个 factorExpression,
      {
        head: factorExpressionUnit,
        body: [leftParenthesisUnit, factorExpressionUnit, rightParenthesisUnit],
      },

      // 规则 9: 一个 factorExpression 和另外一个 factorExpression 的乘除运算得一个 factorExpression
      {
        head: factorExpressionUnit,
        body: [factorExpressionUnit, factorOperatorUnit, factorExpressionUnit],
      },

      // 规则 10: 一个 factorExpression 可视为一个 expression
      {
        head: expressionUnit,
        body: [factorExpressionUnit],
      },

      // 规则 11: 一个 expression 允许嵌套在括号中
      {
        head: expressionUnit,
        body: [leftParenthesisUnit, expressionUnit, rightParenthesisUnit],
      },

      // 规则 12: 一个 expression 加减另外一个 expression 得一个 expression
      {
        head: expressionUnit,
        body: [expressionUnit, addOrSubtractOperatorUnit, expressionUnit],
      },
    ];
  }
}
