/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  LL1MatchFunctionDescriptor,
  MatchFunction,
  MatchFunctionDescriptor,
  MatchResult,
  PatternMatchFunctionDescriptor,
  TokenType,
} from './interfaces';

const presetStates: { default: MatchFunction } = { default: null as any };

function makeLL1MatchDescriptor(
  lookAhead: string,
  group: { prefix: string; tokenClassName: TokenType }[],
): LL1MatchFunctionDescriptor {
  group.sort((a, b) => b.prefix.length - a.prefix.length);
  return {
    lookAhead,
    type: 'll1',
    matchFunction: (buffer, cb, emit, setNext) => {
      const maxPrefixLen = group[0].prefix.length;
      if (buffer.length >= maxPrefixLen) {
        for (const item of group) {
          if (buffer.slice(0, item.prefix.length) === item.prefix) {
            emit({ content: item.prefix, tokenClassName: item.tokenClassName });
            setNext((char, cb, emit, setNext) =>
              presetStates.default(
                buffer.slice(item.prefix.length, buffer.length) + char,
                cb,
                emit,
                setNext,
              ),
            );
            cb();
            return;
          }
        }
        setNext((char, cb, emit, setNext) =>
          presetStates.default(
            buffer.slice(1, buffer.length) + char,
            cb,
            emit,
            setNext,
          ),
        );
      } else {
        setNext((char, cb, emit, setNext) =>
          presetStates.default(buffer + char, cb, emit, setNext),
        );
      }
      cb();
    },
  };
}

const ll1MatchFunctionDescriptors: LL1MatchFunctionDescriptor[] = [
  // 匹配 ,
  makeLL1MatchDescriptor(',', [{ prefix: ',', tokenClassName: 'comma' }]),

  // 匹配 :=, :->
  makeLL1MatchDescriptor(':', [
    { prefix: ':->', tokenClassName: 'columnRightArrow' },
    { prefix: ':=', tokenClassName: 'columnEqual' },
  ]),

  // 匹配 =, ==, ===
  makeLL1MatchDescriptor('=', [
    { prefix: '===', tokenClassName: 'tripleEqual' },
    { prefix: '==', tokenClassName: 'doubleEqual' },
    { prefix: '=', tokenClassName: 'equal' },
  ]),

  // 匹配 /, /.
  makeLL1MatchDescriptor('/', [
    { prefix: '/.', tokenClassName: 'substitute' },
    { prefix: '/', tokenClassName: 'divide' },
  ]),

  // 匹配 -, ->
  makeLL1MatchDescriptor('-', [
    { prefix: '->', tokenClassName: 'rightArrow' },
    { prefix: '-', tokenClassName: 'minus' },
  ]),

  // 匹配 &&
  makeLL1MatchDescriptor('&', [{ prefix: '&&', tokenClassName: 'and' }]),

  // 匹配 ||
  makeLL1MatchDescriptor('|', [{ prefix: '||', tokenClassName: 'or' }]),

  // 匹配 !, != 或者 !==
  makeLL1MatchDescriptor(',', [
    { prefix: '!==', tokenClassName: 'notStrictEqual' },
    { prefix: '!=', tokenClassName: 'notEqual' },
    { prefix: '!', tokenClassName: 'exclamation' },
  ]),

  // 匹配 >, >=
  makeLL1MatchDescriptor('>', [
    { prefix: '>=', tokenClassName: 'rightAngleEqual' },
    { prefix: '>', tokenClassName: 'rightAngle' },
  ]),

  // 匹配 <, <=
  makeLL1MatchDescriptor('<', [
    { prefix: '<=', tokenClassName: 'leftAngleEqual' },
    { prefix: '<', tokenClassName: 'leftAngle' },
  ]),

  // 匹配 + 和 ++
  makeLL1MatchDescriptor('+', [
    { prefix: '++', tokenClassName: 'doublePlus' },
    { prefix: '+', tokenClassName: 'plus' },
  ]),

  // 匹配 *
  makeLL1MatchDescriptor('*', [{ prefix: '*', tokenClassName: 'times' }]),

  // 匹配 %
  makeLL1MatchDescriptor('%', [{ prefix: '%', tokenClassName: 'percent' }]),

  // 匹配 ^
  makeLL1MatchDescriptor('^', [{ prefix: '^', tokenClassName: 'power' }]),

  // 匹配 _, __, ___
  makeLL1MatchDescriptor('_', [
    { prefix: '___', tokenClassName: 'tripleUnderline' },
    { prefix: '__', tokenClassName: 'doubleUnderline' },
    { prefix: '_', tokenClassName: 'singleUnderline' },
  ]),

  // 匹配 ( 和 (* ... *)
  {
    type: 'll1',
    lookAhead: '(',
    matchFunction: (buffer, cb, emit, setNext) => {
      if (buffer === '(*') {
        const matchCommentEnd: MatchFunction = (buffer, cb, emit, setNext) => {
          if (
            buffer.length >= 4 &&
            buffer.slice(buffer.length - 2, buffer.length) === '*)'
          ) {
            emit({ content: buffer, tokenClassName: 'comment' });
            setNext(presetStates.default);
            cb();
          } else {
            setNext((char, cb, emit, setNext) =>
              matchCommentEnd(buffer + char, cb, emit, setNext),
            );
            cb();
          }
        };
        setNext((char, cb, emit, setNext) =>
          matchCommentEnd(buffer + char, cb, emit, setNext),
        );
        cb();
      } else {
        emit({ content: '(', tokenClassName: 'leftParentheses' });
        setNext((char, cb, emit, setNext) =>
          presetStates.default(
            buffer.slice(1, buffer.length) + char,
            cb,
            emit,
            setNext,
          ),
        );
        cb();
      }
    },
  },

  // 匹配 )
  makeLL1MatchDescriptor(')', [
    { prefix: ')', tokenClassName: 'rightParentheses' },
  ]),

  // 匹配 {
  makeLL1MatchDescriptor('{', [{ prefix: '{', tokenClassName: 'leftBracket' }]),

  // 匹配 }
  makeLL1MatchDescriptor('}', [
    { prefix: '}', tokenClassName: 'rightBracket' },
  ]),

  // 匹配 字符串
];

const patternMatchFuntions: PatternMatchFunctionDescriptor[] = [];

const ll1MatchFunctionMap: Record<string, LL1MatchFunctionDescriptor> = ((
  descriptors: LL1MatchFunctionDescriptor[],
) => {
  const map: Record<string, LL1MatchFunctionDescriptor> = {};
  for (const desc of descriptors) {
    map[desc.lookAhead] = desc;
  }
  return map;
})(ll1MatchFunctionDescriptors);

export const initialState: MatchFunction = (buffer, cb, emit, setNext) => {
  if (ll1MatchFunctionMap[buffer[0]]) {
    const nextMatchFn = ll1MatchFunctionMap[buffer].matchFunction;
    setNext((char, cb, emit, setNext) =>
      nextMatchFn(buffer + char, cb, emit, setNext),
    );
    cb();
    return;
  }

  const patternFn: MatchFunctionDescriptor | undefined =
    patternMatchFuntions.find((desc) => desc.pattern.test(buffer[0]));
  if (patternFn) {
    setNext((char, cb, emit, setNext) =>
      patternFn.matchFunction(buffer + char, cb, emit, setNext),
    );
    cb();
    return;
  }

  setNext((char, cb, emit, setNext) =>
    presetStates.default(buffer + char, cb, emit, setNext),
  );
  cb();
};

presetStates.default = initialState;
