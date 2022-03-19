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

  // 匹配 + 和 ++
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

  // 匹配 ,
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

  // 匹配 !, != 或者 !==
  {
    lookAhead: '!',
    type: 'll1',
    matchFunction: (buffer, cb, emit, setNext) => {
      if (buffer.length >= 3) {
        if (buffer.slice(0, 3) === '!==') {
          emit({ content: '!==', tokenClassName: 'notStrictEqual' });
          setNext((char, cb, emit, setNext) =>
            presetStates.default(
              buffer.slice(3, buffer.length) + char,
              cb,
              emit,
              setNext,
            ),
          );
          cb();
        } else if (buffer.slice(0, 2) === '!=') {
          emit({ content: '!=', tokenClassName: 'notEqual' });
          setNext((char, cb, emit, setNext) =>
            presetStates.default(
              buffer.slice(2, buffer.length) + char,
              cb,
              emit,
              setNext,
            ),
          );
          cb();
        } else {
          // buffer === '!'
          emit({ content: '!', tokenClassName: 'exclamation' });
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
      } else {
        setNext((char, cb, emit, setNext) =>
          presetStates.default(buffer + char, cb, emit, setNext),
        );
        cb();
      }
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
