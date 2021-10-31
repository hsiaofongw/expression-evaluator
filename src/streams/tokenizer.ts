import { Transform } from 'stream';
import { Digit, ICharObject, ICharType } from './characterize';

export type IState = {
  name: string;
};

export type StateEntry = {
  from: {
    currentState: IState;
    inputCharType: ICharType;
  };

  to: {
    nextState: IState;
  };
};

export class StateTransferTable {
  _table!: Record<string, Record<string, IState>>;
  _defaultState!: Record<string, IState>;

  constructor() {
    this._table = {};
    this._defaultState = {};
  }

  public add(stateMap: StateEntry): void {
    const currentState = stateMap.from.currentState;
    const inputCharType = stateMap.from.inputCharType;
    const targetState = stateMap.to.nextState;

    if (!this._table[currentState.name]) {
      this._table[currentState.name] = {};
    }

    const fromCurrentState = this._table[currentState.name];
    fromCurrentState[inputCharType.name] = targetState;
  }

  public addDefault(currentState: IState, nextState: IState): void {
    this._defaultState[currentState.name] = nextState;
  }

  public query(
    entrySelector: StateEntry['from'],
  ): StateEntry['to'] | undefined {
    const currentStateKey = entrySelector.currentState.name;
    const inputKey = entrySelector.inputCharType.name;

    const fromMap = this._table[currentStateKey];
    if (fromMap && fromMap[inputKey]) {
      return { nextState: fromMap[inputKey] };
    }

    if (this._defaultState[currentStateKey]) {
      return { nextState: this._defaultState[currentStateKey] };
    }
  }
}

const stateTransferTable = new StateTransferTable();
stateTransferTable.add({
  from: { currentState: { name: 'start' }, inputCharType: new Digit() },
  to: { nextState: { name: 'expectingDigit' } },
});
stateTransferTable.add({
  from: {
    currentState: { name: 'expectingDigit' },
    inputCharType: new Digit(),
  },
  to: { nextState: { name: 'expectingDigit' } },
});

export class TokenizerStream extends Transform {
  _charStack!: ICharObject[];

  constructor() {
    super({ objectMode: true });
    this._charStack = new Array<ICharObject>();
  }

  _shift(char: ICharObject): void {
    return;
  }

  _transform(
    chunk: Buffer,
    encoding: string,
    callback: (error?: any, data?: any) => void,
  ) {
    console.log({ chunk, encoding, callback });
    const stringChunk = chunk.toString('utf-8');

    this.push(stringChunk.toUpperCase());
    callback();
  }
}
