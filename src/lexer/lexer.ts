import { ArrayHelper } from 'src/helpers/to-array';
import { Transform, TransformCallback } from 'stream';
import {
  Char,
  CharClass,
  IndexedChar,
  IState,
  ITokenizeContext,
  Line,
  StateTransition,
  Token,
  TokenClass,
  TypedChar,
  TypedToken,
} from './interfaces';

/** 给 token 标注类型 */
export class TokenTyping extends Transform {
  private _tokenClasses!: TokenClass[];

  constructor(allTokenClasses: TokenClass[]) {
    super({ objectMode: true });

    this._tokenClasses = allTokenClasses;
  }

  _transform(
    chunk: Token,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const matchedTypesAndMatchingLen: {
      type: TokenClass;
      matchLength: number;
    }[] = this._tokenClasses
      .filter((cls) => {
        return chunk.content.match(cls.definition.regexp) !== null;
      })
      .map((cls) => {
        return {
          type: cls,
          matchLength: chunk.content.match(cls.definition.regexp)[0].length,
        };
      });

    if (matchedTypesAndMatchingLen.length > 0) {
      const type = matchedTypesAndMatchingLen.sort(
        (a, b) => b.matchLength - a.matchLength,
      )[0];
      const typedToken: TypedToken = {
        ...chunk,
        type: type.type,
      };
      this.push(typedToken);
    }

    callback();
  }
}

/** 将 typedChar 连成 token */
export class Tokenize extends Transform implements ITokenizeContext {
  private _chars!: TypedChar[];

  private _stateMap!: Record<IState['stateIdentifier'], IState>;

  private _charClassMap!: Record<CharClass['id'], CharClass>;

  private _transition!: Record<
    IState['stateIdentifier'],
    Record<CharClass['id'], StateTransition>
  >;

  private _currentState!: IState;

  constructor(config: {
    allStates: IState[] | Record<string, IState>;
    allCharClasses: CharClass[] | Record<string, CharClass>;
    transitions: StateTransition[];
    startState: IState;
  }) {
    super({ objectMode: true });

    this._chars = [];

    const allStates = Array.isArray(config.allStates)
      ? config.allStates
      : ArrayHelper.toArray(config.allStates);

    this._stateMap = {};
    for (const state of allStates) {
      this._stateMap[state.stateIdentifier] = state;
    }

    const allCharClasses = Array.isArray(config.allCharClasses)
      ? config.allCharClasses
      : ArrayHelper.toArray(config.allCharClasses);

    this._charClassMap = {};
    for (const charClass of allCharClasses) {
      this._charClassMap[charClass.id] = charClass;
    }

    this._transition = {};
    for (const ent of config.transitions) {
      const current = ent.current.stateIdentifier;
      const next = ent.input.id;
      if (this._transition[current] === undefined) {
        this._transition[current] = {};
      }

      this._transition[current][next] = ent;
    }

    this._currentState = config.startState;
  }

  private _evolve(input: TypedChar) {
    const current = this._currentState.stateIdentifier;
    if (this._transition[current] && this._transition[current][input.type.id]) {
      const entry = this._transition[current][input.type.id];
      const next = entry.next.stateIdentifier;
      const nextState = this._stateMap[next];

      if (nextState) {
        this._currentState = nextState;
      }

      const actionToTake = entry.action;
      if (actionToTake) {
        if (typeof actionToTake === 'function') {
          actionToTake(this, input);
        }
      }
    }
  }

  _transform(
    char: TypedChar,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this._evolve(char);
    callback();
  }

  _pushChar(char: TypedChar): void {
    this._chars.push(char);
  }

  _popToken(): void {
    if (this._chars.length > 0) {
      const index = this._chars[0].index;
      const rawToken: Token = {
        offset: index,
        chars: this._chars,
        content: this._chars.map((cObj) => cObj.char).join(''),
      };

      this.push(rawToken);
      this._chars = [];
    }
  }
}

/** 把行切分成一个个 char, 一次进来一个 Line */
export class ToCharacters extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    line: Line,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const chars = line.split('');
    for (const char of chars) {
      this.push(char);
    }

    callback();
  }

  _flush(callback: TransformCallback): void {
    // 故意追加一个代表 eof 的字符
    this.push('');
    callback();
  }
}

/** 给 char 加索引 */
export class ToIndexedCharacter extends Transform {
  _charIndex!: number;

  constructor() {
    super({ objectMode: true });
    this._charIndex = 0;
  }

  _transform(
    char: Char,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const indexedChar: IndexedChar = { char: char, index: this._charIndex };
    this.push(indexedChar);

    this._charIndex = this._charIndex + 1;
    callback();
  }
}

/** 给 char 定类型 */
export class ToTypedCharacter extends Transform {
  private _allCharClasses!: CharClass[];

  constructor(charClasses: CharClass[] | Record<string, CharClass>) {
    super({ objectMode: true });

    this._allCharClasses = Array.isArray(charClasses)
      ? charClasses
      : ArrayHelper.toArray(charClasses);
  }

  _transform(
    chunk: IndexedChar,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    for (const ent of this._allCharClasses) {
      if (ent.regexp.test(chunk.char)) {
        const typedChar: TypedChar = {
          char: chunk.char,
          index: chunk.index,
          type: ent,
        };

        this.push(typedChar);
        break;
      }
    }

    // if cant find any charClass that matches, drop.

    callback();
  }
}
