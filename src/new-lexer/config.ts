/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  LL1MatchFunctionDescriptor,
  MatchFunction,
  MatchFunctionDescriptor,
  MatchResult,
  PatternMatchFunctionDescriptor,
} from './interfaces';

const presetStates: { default: MatchFunction } = { default: null as any };

const ll1MatchFunctionDescriptors: LL1MatchFunctionDescriptor[] = [
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
  {
    type: 'll1',
    lookAhead: '+',
    matchFunction: (buffer, cb, emit, setNext) => {
      if (buffer.length >= 2) {
        if (buffer.slice(0, 2) === '++') {
          const restBuffer = buffer.slice(2, buffer.length);
          emit({ content: '++', tokenClassName: 'doublePlus' });
          setNext((char, cb, emit, setNext) =>
            presetStates.default(restBuffer + char, cb, emit, setNext),
          );
          cb();
        } else {
          const restBuffer = buffer.slice(1, buffer.length);
          emit({ content: '+', tokenClassName: 'plus' });
          setNext((char, cb, emit, setNext) =>
            presetStates.default(restBuffer + char, cb, emit, setNext),
          );
          cb();
        }
      } else {
        setNext((char, cb, emit, setNext) =>
          presetStates.default(buffer + char, cb, emit, setNext),
        );
        cb();
      }
    },
  },
  {
    type: 'll1',
    lookAhead: ',',
    matchFunction: (buffer, cb, emit, setNext) => {
      emit({ content: ',', tokenClassName: 'comma' });
      setNext((char, cb, emit, setNext) =>
        presetStates.default(
          buffer.slice(1, buffer.length) + char,
          cb,
          emit,
          setNext,
        ),
      );
      cb();
    },
  },
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

export const initialState: MatchFunction = (
  buffer: string,
  moreChar: () => void,
  emitToken: (token: MatchResult) => void,
  setNextState: (nextState: MatchFunction) => void,
) => {
  let nextMatchFn: MatchFunction = initialState;
  if (ll1MatchFunctionMap[buffer[0]]) {
    nextMatchFn = ll1MatchFunctionMap[buffer].matchFunction;
  }

  const patternFn: MatchFunctionDescriptor | undefined =
    patternMatchFuntions.find((desc) => desc.pattern.test(buffer[0]));
  if (patternFn) {
    nextMatchFn = patternFn.matchFunction;
  }

  setNextState((char, more, emit, setNext) =>
    nextMatchFn(buffer + char, more, emit, setNext),
  );
  moreChar();
};

presetStates.default = initialState;
