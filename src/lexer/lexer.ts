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
  | 'string'
  | 'stringEscape'
  | 't'
  | 'tr'
  | 'tru'
  | 'true'
  | 'f'
  | 'fa'
  | 'fal'
  | 'fals'
  | 'false'
  | 'n'
  | 'nu'
  | 'nul'
  | 'null';

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
      // 如果遇到一个左方括号 [
      if (charObject.char === '[') {
        this._emitSingleToken(charObject, tokenClasses.leftSquareBracket);
        return;
      }

      // 如果遇到一个右方括号 ]
      if (charObject.char === ']') {
        this._emitSingleToken(charObject, tokenClasses.rightSquareBracket);
        return;
      }

      // 如果遇到一个左花括号 {
      if (charObject.char === '{') {
        this._emitSingleToken(charObject, tokenClasses.leftBracket);
        return;
      }

      // 如果遇到一个右花括号 }
      if (charObject.char === '}') {
        this._emitSingleToken(charObject, tokenClasses.rightBracket);
        return;
      }

      // 如果遇到一个逗号 ,, 则 emit 一个逗号 , token
      if (charObject.char === ',') {
        this._emitSingleToken(charObject, tokenClasses.comma);
        return;
      }

      // 如果遇到一个双引号 "
      if (charObject.char === '"') {
        // 双引号本身丢弃

        // 设置字符串起始 offset, 在双引号后一位
        this._offset = charObject.offset + 1;

        // 进入 string 模式
        this._state = 'string';
        return;
      }

      // 如果遇到 t, 接下来逐个匹配 r, u, e
      if (charObject.char === 't') {
        this._append(charObject.char);
        this._offset = charObject.offset;
        this._state = 't';
      }

      // 如果遇到 f, 接下来逐个匹配 a, l, s, e
      if (charObject.char === 'f') {
        this._append('f');
        this._offset = charObject.offset;
        this._state = 'f';
      }

      // 如果遇到 n, 接下来逐个匹配 u, l, l
      if (charObject.char === 'n') {
        this._append('n');
        this._offset = charObject.offset;
        this._state = 'n';
      }

      // 如果遇到空白字符, 这代表一个特殊的信号：输入串结束了
      if (charObject.char === '') {
        this._emitSingleToken(charObject, tokenClasses.endOfFile);
        return;
      }

      // 如果遇到数字或者负号
      if (charObject.char === '-' || charObject.char.match(/\d/)) {
        // 保存当前 char
        this._append(charObject.char);

        // 保存 token 起始 offset
        this._offset = charObject.offset;

        // 进入 number 输入状态
        this._state = 'number';

        return;
      }

      // 遇到小数点
      if (charObject.char.match(/\./)) {
        // 保存当前 char
        this._append(charObject.char);

        // 保存 token 起始 offset
        this._offset = charObject.offset;

        // 进入 float 输入状态
        this._state = 'float';

        return;
      }

      // 遇到冒号
      if (charObject.char === ':') {
        this._emitSingleToken(charObject, tokenClasses.columnToken);
        return;
      }
    },

    // 这些回调都可以以编程的方式自动写入，但我为了代码易读性不这么写
    t: (charObj) => this._expectOnly(charObj, 'r', 'tr'),
    tr: (charObj) => this._expectOnly(charObj, 'u', 'tru'),
    tru: (charObj) => this._expectOnly(charObj, 'e', 'true'),
    true: (charObj) => this._emitToken(charObj, tokenClasses.trueToken),

    f: (cObj) => this._expectOnly(cObj, 'a', 'fa'),
    fa: (cObj) => this._expectOnly(cObj, 'l', 'fal'),
    fal: (cObj) => this._expectOnly(cObj, 's', 'fals'),
    fals: (cObj) => this._expectOnly(cObj, 'e', 'false'),
    false: (cObj) => this._emitToken(cObj, tokenClasses.falseToken),

    n: (charObj) => this._expectOnly(charObj, 'u', 'nu'),
    nu: (charObj) => this._expectOnly(charObj, 'l', 'nul'),
    nul: (charObj) => this._expectOnly(charObj, 'l', 'null'),
    null: (charObj) => this._emitToken(charObj, tokenClasses.nullToken),

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
  };

  constructor() {
    super({ objectMode: true });
  }

  /** 期待单个字符否则退出 */
  private _expectOnly(
    charObj: CharObject,
    char: string,
    nextState: State,
  ): void {
    if (charObj.char === char) {
      this._append(charObj.char);
      this._state = nextState;
    } else {
      console.error(`Unexpected symbol in tokenizing`);
      process.exit(1);
    }
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
