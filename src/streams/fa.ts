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
