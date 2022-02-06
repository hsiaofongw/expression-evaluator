/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Transform, TransformCallback } from 'stream';
import { tokenClasses } from './config';
import { CharObject, Line, TokenClass, TypedToken } from './interfaces';

/** 把行切分成一个个 char, 一次进来一个 Line */
export class ToCharacters extends Transform {
  private _offset = 0;
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    line: Line,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    for (const char of line) {
      const charObject: CharObject = { char, offset: this._offset };

      // emit every character
      this.push(charObject);
      this._offset = this._offset + 1;
    }

    // emit a endOfLine char
    const charObject: CharObject = { char: '', offset: this._offset };
    this.push(charObject);

    // reset
    this._offset = 0;

    // ready for next line input
    callback();
  }
}

type StateAction = (charObject: CharObject) => void;
type State =
  | 'start'
  | 'number'
  | 'float'
  | 'identifier'
  | 'string'
  | 'stringEscape'
  | 'equalSign'
  | 'lessThanAndThen'
  | 'greaterThanAndThen';

/** 将 chars 组合成 token */
export class ToToken extends Transform {
  /** 来不及处理的 buffer, 可能要到下一回处理，是一个队列 */
  private _charBuffer: CharObject[] = [];

  /** 保存当前 token 内容, 应用于多个字符的 token, 例如数字、浮点数、标识符、多字符符号等 */
  private _content = '';

  /** 保存当前 token 起始 offset */
  private _offset = 0;

  /** 保存当前状态 */
  private _state: State = 'start';

  private _actions: Record<State, StateAction> = {
    // 在初始状态下
    start: (charObject) => {
      // 如果遇到一个加号 +, 则 emit 一个加号 + token
      if (charObject.char.match(/\+/)) {
        this._emitSingleToken(charObject, tokenClasses.plus);
        return;
      }

      // 如果遇到一个减号 +, 则 emit 一个减号 - token
      if (charObject.char.match(/\-/)) {
        this._emitSingleToken(charObject, tokenClasses.minus);
        return;
      }

      // 如果遇到一个乘号 *, 则 emit 一个乘号 * token
      if (charObject.char.match(/\*/)) {
        this._emitSingleToken(charObject, tokenClasses.times);
        return;
      }

      // 如果遇到一个除号 /, 则 emit 一个除号 / token
      if (charObject.char.match(/\//)) {
        this._emitSingleToken(charObject, tokenClasses.divideBy);
        return;
      }

      // 如果遇到一个左括号 (, 则 emit 一个左括号 ( token
      if (charObject.char.match(/\(/)) {
        this._emitSingleToken(charObject, tokenClasses.leftParenthesis);
        return;
      }

      // 如果遇到一个右括号 ), 则 emit 一个右括号 ) token
      if (charObject.char.match(/\)/)) {
        this._emitSingleToken(charObject, tokenClasses.rightParenthesis);
        return;
      }

      // 如果遇到一个左方括号 [, 则 emit 一个左方括号 [ token
      if (charObject.char.match(/\[/)) {
        this._emitSingleToken(charObject, tokenClasses.leftSquareBracket);
        return;
      }

      // 如果遇到一个右方括号 ], 则 emit 一个右方括号 ] token
      if (charObject.char.match(/\]/)) {
        this._emitSingleToken(charObject, tokenClasses.rightSquareBracket);
        return;
      }

      // 如果遇到一个左花括号 {, 则 emit 一个左花括号 { token
      if (charObject.char.match(/\{/)) {
        this._emitSingleToken(charObject, tokenClasses.leftBracket);
        return;
      }

      // 如果遇到一个右花括号 }, 则 emit 一个右花括号 } token
      if (charObject.char.match(/\}/)) {
        this._emitSingleToken(charObject, tokenClasses.rightBracket);
        return;
      }

      // 如果遇到一个逗号 ,, 则 emit 一个逗号 , token
      if (charObject.char.match(/\,/)) {
        this._emitSingleToken(charObject, tokenClasses.comma);
        return;
      }

      // 如果遇到一个插入符
      if (charObject.char === '^') {
        this._emitSingleToken(charObject, tokenClasses.caretSign);
      }

      // 如果遇到一个百分号
      if (charObject.char === '%') {
        this._emitSingleToken(charObject, tokenClasses.percentSign);
      }

      // 如果遇到一个双引号 "
      if (charObject.char.match(/\"/)) {
        // 双引号本身丢弃

        // 设置字符串起始 offset, 在双引号后一位
        this._offset = charObject.offset + 1;

        // 进入 string 模式
        this._state = 'string';
        return;
      }

      // 如果遇到一个等于号 =
      if (charObject.char === '=') {
        this._offset = charObject.offset;
        this._append(charObject.char);

        // 进入等于号输入模式
        this._state = 'equalSign';
        return;
      }

      // 如果遇到一个小于号 <
      if (charObject.char === '<') {
        this._offset = charObject.offset;
        this._append(charObject.char);
        this._state = 'lessThanAndThen';
      }

      // 如果遇到一个大于号 >
      if (charObject.char === '>') {
        this._offset = charObject.offset;
        this._append(charObject.char);
        this._state = 'greaterThanAndThen';
      }

      // 如果遇到空白字符, 这代表一个特殊的信号：输入串结束了
      if (charObject.char === '') {
        this._emitSingleToken(charObject, tokenClasses.endOfFile);
        return;
      }

      // 如果遇到数字
      if (charObject.char.match(/\d/)) {
        // 保存当前 char
        this._append(charObject.char);

        // 保存 token 起始 offset
        this._offset = charObject.offset;

        // 进入 number 输入状态
        this._state = 'number';

        return;
      }

      // 如果遇到小数点
      if (charObject.char.match(/\./)) {
        // 保存当前 char
        this._append(charObject.char);

        // 保存 token 起始 offset
        this._offset = charObject.offset;

        // 进入 float 输入状态
        this._state = 'float';

        return;
      }

      // 如果如果遇到 [a-zA-Z_]
      if (charObject.char.match(/[a-zA-Z_]/)) {
        // 保存当前 char
        this._append(charObject.char);

        // 保存 token 起始 offset
        this._offset = charObject.offset;

        // 进入 identifier 输入状态
        this._state = 'identifier';

        return;
      }
    },

    // 在 number 输入状态下
    number: (charObject) => {
      if (charObject.char.match(/\d/)) {
        // 如果遇到 number

        // 吸收
        this._append(charObject.char);
      } else if (charObject.char.match(/\./)) {
        // 如果遇到小数点

        // 吸收
        this._append(charObject.char);

        // 进入 float 输入状态
        this._state = 'float';
      } else {
        // 对于所有其他使得 number 输入状态中止的输入
        this._emitToken(charObject, tokenClasses.number);
      }
    },

    // 在 float 输入状态下
    float: (charObject) => {
      if (charObject.char.match(/\d/)) {
        // 如果遇到 number

        // 吸收
        this._append(charObject.char);
      } else {
        // 对于所有其他使得 float 输入状态中止的输入
        this._emitToken(charObject, tokenClasses.number);
      }
    },

    // 在 identifier 输入状态下
    identifier: (charObject) => {
      if (charObject.char.match(/[a-zA-Z0-9_]/)) {
        // 如果遇到 identifier 其余 char

        // 吸收
        this._append(charObject.char);
      } else {
        // 对于所有其他使得 identifier 输入状态中止的输入
        this._emitToken(charObject, tokenClasses.identifier);
      }
    },

    // 在 string 输入状态下
    string: (charObject) => {
      if (charObject.char.match(/\\/)) {
        // 当前字符本身跳过

        // 进入字符转义状态
        this._state = 'stringEscape';
      } else if (charObject.char.match(/[^\"]/)) {
        // 吸收
        this._append(charObject.char);
      } else {
        // 对于其余所有的情况
        // this._charBuffer.push()

        // 释出 token
        const token: TypedToken = {
          offset: this._offset,
          content: this._content,
          type: tokenClasses.stringToken,
        };
        this.push(token);

        // 重置 token 内容区
        this._content = '';

        // 回到开始状态
        this._state = 'start';
      }
    },

    // 字符转义模式，接受且只接受一个
    stringEscape: (charObject) => {
      const escapeTable: Record<string, string> = {
        a: '07',
        b: '08',
        e: '1B',
        f: '0C',
        n: '0A',
        r: '0D',
        t: '09',
        v: '0B',
        '\\': '5C',
        "'": '27',
        '"': '22',
        '?': '3F',
      };

      const charHex = escapeTable[charObject.char];
      if (charHex !== undefined) {
        const targetChar = Buffer.from(charHex, 'hex').toString('utf8');
        this._append(targetChar);
      }

      // 立马回到 string 状态
      this._state = 'string';
    },

    // 等于号输入模式，此模式下将又可能输出单等于号、双等于号或者仨等于号
    equalSign: (charObj) => {
      if (charObj.char !== '=') {
        this._charBuffer.push(charObj);

        const singleEqual = tokenClasses.assignToken;
        const doubleEqual = tokenClasses.doubleEqualSign;
        // 当前 parser 对于仨等于号 token 还没有对应的语法规则去消化
        // const tripleEqual = tokenClasses.tripleEqualSign;
        const tokenType =
          this._content.length === 1 ? singleEqual : doubleEqual;

        const token: TypedToken = {
          offset: this._offset,
          content: this._content,
          type: tokenType,
        };

        this._content = '';
        this._state = 'start';
        this.push(token);
        return;
      }

      this._append(charObj.char);
    },

    // 小于号 < 及其后续
    lessThanAndThen: (charObj) => {
      if (charObj.char === '=') {
        this._append('=');
        const token: TypedToken = {
          offset: this._offset,
          content: this._content,
          type: tokenClasses.lessThanOrEqualSign,
        };
        this._content = '';
        this._state = 'start';
        this.push(token);
      } else {
        this._charBuffer.push(charObj);
        const token: TypedToken = {
          offset: this._offset,
          content: this._content,
          type: tokenClasses.lessThanSign,
        };
        this._content = '';
        this._state = 'start';
        this.push(token);
      }
    },

    // 大于号 > 及其后续
    greaterThanAndThen: (charObj) => {
      if (charObj.char === '=') {
        this._append('=');
        const token: TypedToken = {
          offset: this._offset,
          content: this._content,
          type: tokenClasses.greaterThanOrEqualTo,
        };
        this._content = '';
        this._state = 'start';
        this.push(token);
      } else {
        this._charBuffer.push(charObj);
        const token: TypedToken = {
          offset: this._offset,
          content: this._content,
          type: tokenClasses.greaterThanSign,
        };
        this._content = '';
        this._state = 'start';
        this.push(token);
      }
    },
  };

  constructor() {
    super({ objectMode: true });
  }

  /** 吸收 char */
  private _append(char: string): void {
    this._content = this._content + char;
  }

  /** 释出当前存储的 token, 通常为多字符 token */
  private _emitToken(charObject: CharObject, tokenClass: TokenClass): void {
    // char 存入 buffer, 在下一回合处理
    this._charBuffer.push(charObject);

    // 释出 identifier token
    const token: TypedToken = {
      offset: this._offset,
      content: this._content,
      type: tokenClass,
    };
    this.push(token);

    // 重置 token 内容区
    this._content = '';

    // 进入 start 状态，重新路由
    this._state = 'start';
  }

  /** 释出单字符 token */
  private _emitSingleToken(
    charObject: CharObject,
    tokenClass: TokenClass,
  ): void {
    const token: TypedToken = {
      offset: charObject.offset,
      content: charObject.char,
      type: tokenClass,
    };
    this.push(token);
  }

  _transform(
    charObject: CharObject,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this._charBuffer.push(charObject);

    while (this._charBuffer.length) {
      const action = this._actions[this._state];

      if (typeof action !== 'function') {
        const _charObject = this._charBuffer[0];
        const errorContextInfo = {
          charObject: _charObject,
          state: this._state,
        };
        console.error(`没有状态转移函数\n${errorContextInfo}`);
        process.exit(1);
      }

      const _charObject = this._charBuffer.shift() as CharObject;

      action(_charObject);
    }
    callback();
  }
}
