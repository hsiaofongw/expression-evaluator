import { strict as assert } from 'assert';

/** 状态 */
export type IState = {
  /** 状态标识符 */
  stateIdentifier: string;

  /** 状态描述 */
  stateDescription?: string;
};

/** 状态表 */
export type IStateTable = Array<IState>;

/** 状态转移表条目 */
export type IStateTransferTableEntry = {
  /** 当前状态标识符 */
  currentStateIdentifier: IState['stateIdentifier'];

  /** 输入标识符 */
  inputCharacterClassIdentifier: string;

  /** 下一个状态标识符 */
  nextStateIdentifier: IState['stateIdentifier'];
};

/** 状态转移表 */
export type IStateTransferTable = Array<IStateTransferTableEntry>;

/** 字符类目表条目 */
export type ICharacterClassTableEntry = {
  /** 字符类目标识符 */
  characterClassIdentifier: string;

  /** 正则表达式 */
  regularExpression: RegExp;

  /** 字符类目描述 */
  description?: string;

  /** 例子 */
  example?: string;
};

/** 字符类目表 */
export type ICharacterClassTable = Array<ICharacterClassTableEntry>;

/** 有限状态机配置 */
export type IFiniteAutomataConfiguration = {
  /** 状态转移表 */
  stateTransferTable: IStateTransferTable;
};

/** 一个带 offset 的字符对象 */
export type ICharacterObject = {
  /** 在原文中的起始地址 */
  offset: number;

  /** 字符内容 */
  character: string;
};

/** 一个可能带 character 类的字符对象 */
export type IOptionallyTypedCharacterObject = ICharacterObject & {
  /** 字符类 */
  characterClass?: ICharacterClassTableEntry;
};

/** 一个带 character 类的字符对象 */
export type ITypedCharacterObject = ICharacterObject & {
  /** 字符类 */
  characterClass: ICharacterClassTableEntry;
};

/** 原始 token */
export type IRawToken = {
  /** 字符对象列表 */
  characterObjects: ITypedCharacterObject[];
};

/** 有限状态机 */
export class FiniteAutomata {
  constructor(
    private configuration: IFiniteAutomataConfiguration,
    private _state?: IState['stateIdentifier'],
    private _stateTranferTableIndex?: Record<
      IState['stateIdentifier'],
      Record<IState['stateIdentifier'], IState['stateIdentifier']>
    >,
  ) {}

  /** 返回一个设置了初始状态的 FA */
  public initialize(
    initialStateIdentifier: IState['stateIdentifier'],
  ): FiniteAutomata {
    const tableIndex: typeof this._stateTranferTableIndex = {};

    for (const ent of this.configuration.stateTransferTable) {
      const current = ent.currentStateIdentifier;
      const inputIdentifier = ent.inputCharacterClassIdentifier;
      const next = ent.nextStateIdentifier;

      if (tableIndex[current] === undefined) {
        tableIndex[current] = {};
      }

      tableIndex[current][inputIdentifier] = next;
    }

    return new FiniteAutomata(
      this.configuration,
      initialStateIdentifier,
      tableIndex,
    );
  }

  /** Feed 一个输入，让 FA 演化到下一个状态，并返回下一时刻的 FA */
  public feed(
    inputCharacterClassIdentifier: ICharacterClassTableEntry['characterClassIdentifier'],
  ): FiniteAutomata {
    // 如果 this._state 为 undefined 则报错
    assert.notStrictEqual(this._state, undefined);

    // 如果 this._stateTransferTableIndex 为 undefined 则报错
    assert.notStrictEqual(this._stateTranferTableIndex, undefined);

    const subTransitionTableIndex = this._stateTranferTableIndex[this._state];

    // 如果状态转移表中没有当前 state 相关的条目则报错
    assert.notStrictEqual(subTransitionTableIndex, undefined);

    const nextStateIdentifier: IState['stateIdentifier'] =
      subTransitionTableIndex[inputCharacterClassIdentifier];

    // 如果找不到下一个状态则报错
    assert.notStrictEqual(nextStateIdentifier, undefined);

    return new FiniteAutomata(
      this.configuration,
      nextStateIdentifier,
      this._stateTranferTableIndex,
    );
  }

  /** 获取当前状态的 Identifier */
  public getStateIdentifier(): IState['stateIdentifier'] {
    const currentStateIdentifier = this._state;
    assert.notStrictEqual(currentStateIdentifier, undefined);
    assert.notStrictEqual(currentStateIdentifier, null);

    return currentStateIdentifier;
  }
}

/** 字符类型检测器 */
export class CharacterClassDetector {
  constructor(private characterClassTable: ICharacterClassTable) {}

  /** 检测一个字符属于哪一类 */
  public detect(character: string): ICharacterClassTableEntry | undefined {
    return (
      this.characterClassTable.find((ent) =>
        ent.regularExpression.test(character),
      ) ?? undefined
    );
  }
}

/** 词法分析上下文类 */
export class TokenizeContext {
  private _bufferIndex = 0;
  private _tokenBuffer!: IRawToken;
  private _tokens: IRawToken[] = new Array<IRawToken>();
  public get tokens(): IRawToken[] {
    return this._tokens;
  }

  constructor(private inputSequence: ITypedCharacterObject[]) {}

  /** 从缓冲区取出一个字符对象 */
  public popCharacterObject(): ITypedCharacterObject {
    assert.strictEqual(this._bufferIndex < this.inputSequence.length, true);
    const charObject = this.inputSequence[this._bufferIndex];
    this._bufferIndex = this._bufferIndex + 1;
    return charObject;
  }

  /** 内部创建一个新 token */
  public createOneNewToken(): void {
    this._tokenBuffer = {
      characterObjects: new Array<ITypedCharacterObject>(),
    };
  }

  /** 把一个字符对象追加到当前 token */
  public appendCharacterObjectToCurrentToken(
    charObject: ITypedCharacterObject,
  ): void {
    this._assertCurrentTokenExist();
    this._tokenBuffer.characterObjects.push(charObject);
  }

  /** 保存当前 token */
  public saveCurrentToken(): void {
    this._assertCurrentTokenExist();
    this._tokens.push(this._tokenBuffer);
  }

  /** 断言当前 token 存在 */
  private _assertCurrentTokenExist(): void {
    assert.notStrictEqual(this._tokenBuffer, undefined);
    assert.notStrictEqual(this._tokenBuffer.characterObjects, undefined);
    assert.strictEqual(Array.isArray(this._tokenBuffer.characterObjects), true);
  }
}

/** 状态转移动作条目 */
export type IStateTransferActionTableEntry = {
  /** 当前状态标识符 */
  currentStateIdentifier: IState['stateIdentifier'];

  /** 输入标识符 */
  inputCharacterClassIdentifier: string;

  /** 动作 */
  action: (context: TokenizeContext) => void;
};

/** 状态转移动作条目表 */
export type IStateTransferActionTable = IStateTransferActionTableEntry[];

/** 状态转移动作表索引 */
export type IStateTransferActionTableIndex = Record<
  IStateTransferActionTableEntry['currentStateIdentifier'],
  Record<
    IStateTransferActionTableEntry['inputCharacterClassIdentifier'],
    IStateTransferActionTableEntry['action']
  >
>;
