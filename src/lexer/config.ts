import { CharClass, IState, StateTransition } from './interfaces';

const endOfFileCharClass: CharClass = {
  id: 'endOfFile',
  regexp: /^$/,
  description: '输入终结符',
  example: '',
};

const spaceCharClass: CharClass = {
  id: 'space',
  regexp: /\s/,
  description: '空白符，包括换行、回车、空格、制表等等',
};

const digitCharClass: CharClass = {
  id: 'digit',
  regexp: /\d/,
  description: '数字, 0,1,2,3,4,5,6,7,8,9,',
};

const symbolCharClass: CharClass = {
  id: 'symbol',
  regexp: /[()+\-*/.]/,
  description: '括号、加减乘除、小数点',
};

export const charClass = {
  endOfFileCharClass,
  spaceCharClass,
  digitCharClass,
  symbolCharClass,
};

const startState: IState = {
  stateIdentifier: 'start',
  stateDescription: '初始状态',
};

const numberInputState: IState = {
  stateIdentifier: 'numberInput',
  stateDescription: '数字输入',
};

const symbolInputState: IState = {
  stateIdentifier: 'symbolInput',
  stateDescription: '符号输入',
};

export const allStates = { startState, numberInputState, symbolInputState };

export const stateTransitions: StateTransition[] = [
  // from start state
  {
    current: allStates.startState,
    input: charClass.spaceCharClass,
    next: allStates.startState,
    comment: '跳过空白符',
  },
  {
    current: allStates.startState,
    input: charClass.digitCharClass,
    next: allStates.numberInputState,
    action: (ctx, input) => {
      ctx._pushChar(input);
    },
    comment: '若当前状态是初始状态，并且遇到了一个 digit, 那么将该 char 入栈',
  },
  {
    current: allStates.startState,
    input: charClass.endOfFileCharClass,
    next: allStates.startState,
    action: (ctx, _) => {
      ctx._popToken();
    },
    comment: '结束时，将 token 弹出',
  },
  {
    current: allStates.startState,
    input: charClass.symbolCharClass,
    next: allStates.symbolInputState,
    action: (ctx, symbol) => {
      ctx._pushChar(symbol);
    },
    comment: '支持未来的多个 char symbol',
  },

  // from numberInput state
  {
    current: allStates.numberInputState,
    input: charClass.digitCharClass,
    next: allStates.numberInputState,
    action: (ctx, digit) => {
      ctx._pushChar(digit);
    },
    comment: '吸收 digit',
  },
  {
    current: allStates.numberInputState,
    input: charClass.endOfFileCharClass,
    next: allStates.startState,
    action: (ctx, _) => {
      ctx._popToken();
    },
  },
  {
    current: allStates.numberInputState,
    input: charClass.spaceCharClass,
    next: allStates.startState,
    action: (ctx, _) => {
      ctx._popToken();
    },
  },
  {
    current: allStates.numberInputState,
    input: charClass.symbolCharClass,
    next: allStates.symbolInputState,
    action: (ctx, symbol) => {
      ctx._popToken();
      ctx._pushChar(symbol);
    },
  },

  // from symbol input state
  {
    current: allStates.symbolInputState,
    input: charClass.digitCharClass,
    next: allStates.numberInputState,
    action: (ctx, digit) => {
      ctx._popToken();
      ctx._pushChar(digit);
    },
  },
  {
    current: allStates.symbolInputState,
    input: charClass.endOfFileCharClass,
    next: allStates.startState,
    action: (ctx, _) => {
      ctx._popToken();
    },
  },
  {
    current: allStates.symbolInputState,
    input: charClass.spaceCharClass,
    next: allStates.startState,
    action: (ctx, _) => {
      ctx._popToken();
    },
  },
  {
    current: allStates.symbolInputState,
    input: charClass.symbolCharClass,
    next: allStates.symbolInputState,
    action: (ctx, _) => {
      ctx._popToken();
    },
  },
];
