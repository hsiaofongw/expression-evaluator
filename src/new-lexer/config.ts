/* eslint-disable @typescript-eslint/no-unused-vars */
import { StringHelper } from 'src/helpers/string-helper';
import {
  LL1MatchFunctionDescriptor,
  MatchFunction,
  MatchFunctionDescriptor,
  MatchResult,
  PatternMatchFunctionDescriptor,
  TokenType,
} from './interfaces';

const presetStates: { default: MatchFunction } = { default: null as any };

type TokenPrefix = { prefix: string; tokenClassName: TokenType };

function makeLL1MatchDescriptor(
  lookAhead: string,
  group: { prefix: string; tokenClassName: TokenType }[],
): LL1MatchFunctionDescriptor {
  group.sort((a, b) => b.prefix.length - a.prefix.length);
  const maxPrefix = group[0].prefix;

  return {
    lookAhead,
    type: 'll1',
    matchFunction: (buffer, cb, emit, setNext) => {
      let availablePrefixes: TokenPrefix[] = group;
      const candidates: TokenPrefix[] = [];
      for (let i = 0; i < buffer.length; i++) {
        const bufferSlice = buffer.slice(0, i + 1);

        // 将 availablePrefixes 中完全匹配的项移出并且放入 candidates
        const tmp: TokenPrefix[] = [];
        for (const item of availablePrefixes) {
          if (item.prefix === bufferSlice) {
            candidates.push(item);
          } else {
            tmp.push(item);
          }
        }
        availablePrefixes = tmp;

        // 过滤 availablePrefixies, 留下那些部分匹配的项
        availablePrefixes = availablePrefixes.filter(
          (item) => item.prefix.indexOf(bufferSlice) === 0,
        );

        // 假如过滤之后 availablePrefixies 为空，则查看 candidates 中有没有元素
        if (availablePrefixes.length === 0) {
          if (candidates.length !== 0) {
            candidates.sort((a, b) => b.prefix.length - a.prefix.length);
            const emitContent = candidates[0].prefix;
            emit({
              content: emitContent,
              tokenClassName: candidates[0].tokenClassName,
            });
            const rest = buffer.slice(emitContent.length, buffer.length);
            setNext((char, cb, emit, setNext) =>
              presetStates.default(rest + char, cb, emit, setNext),
            );
          } else {
            const rest = buffer.slice(1, buffer.length);
            setNext((char, cb, emit, setNext) =>
              presetStates.default(rest + char, cb, emit, setNext),
            );
          }
          cb();
          return;
        }
      }

      // 执行到这个地方，buffer 被完全 consume, 并且 availablePrefixies 非空
      const matchRest: MatchFunction = (buffer, cb, emit, setNext) => {
        // 将 availablePrefixes 中完全匹配的项移出并且放入 candidates
        const tmp: TokenPrefix[] = [];
        for (const item of availablePrefixes) {
          if (item.prefix === buffer) {
            candidates.push(item);
          } else {
            tmp.push(item);
          }
        }
        availablePrefixes = tmp;

        // 过滤 availablePrefixies, 留下那些部分匹配的项
        availablePrefixes = availablePrefixes.filter(
          (item) => item.prefix.indexOf(buffer) === 0,
        );

        if (availablePrefixes.length === 0) {
          if (candidates.length === 0) {
            const rest = buffer.slice(1, buffer.length);
            setNext((char, cb, emit, setNext) =>
              presetStates.default(rest + char, cb, emit, setNext),
            );
          } else {
            candidates.sort((a, b) => b.prefix.length - a.prefix.length);
            const emitContent = candidates[0].prefix;
            emit({
              content: emitContent,
              tokenClassName: candidates[0].tokenClassName,
            });
            const rest = buffer.slice(emitContent.length, buffer.length);
            setNext((char, cb, emit, setNext) =>
              presetStates.default(rest + char, cb, emit, setNext),
            );
          }
        } else {
          setNext((char, cb, emit, setNext) =>
            matchRest(buffer + char, cb, emit, setNext),
          );
        }
        cb();
      };
      matchRest(buffer, cb, emit, setNext);
    },
  };
}

const makeGeneralReceiver: (
  terminatePredicate: (buffer: string) => boolean,
  tokenClassName: TokenType,
  contentExtractor: (buffer: string) => string,
) => MatchFunction = (terminatePredicate, tokenClassName, contentExtractor) => {
  const matchFunction: MatchFunction = (buffer, cb, emit, setNext) => {
    if (terminatePredicate(buffer)) {
      const content = contentExtractor(buffer);
      const rest = buffer.slice(content.length, buffer.length);
      emit({ content, tokenClassName });
      setNext((char, cb, emit, setNext) =>
        presetStates.default(rest + char, cb, emit, setNext),
      );
    } else {
      setNext((char, cb, emit, setNext) =>
        matchFunction(buffer + char, cb, emit, setNext),
      );
    }
    cb();
  };

  return matchFunction;
};

const windowSlide = (
  buffer: string,
  skip: number,
  windowSize: number,
  terminatePredicate: (window: string) => boolean,
) => {
  const doWindowSlide: (windowPtr: number, buffer: string) => number = (
    windowPtr,
    buffer,
  ) => {
    if (windowPtr + windowSize > buffer.length) {
      return windowPtr;
    }

    const window = buffer.slice(windowPtr, windowPtr + windowSize);
    if (terminatePredicate(window)) {
      return windowPtr;
    }

    return doWindowSlide(windowPtr + 1, buffer);
  };

  return doWindowSlide(skip, buffer);
};

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

  // 匹配 |>, ||
  makeLL1MatchDescriptor('|', [
    { prefix: '||', tokenClassName: 'or' },
    { prefix: '|>', tokenClassName: 'columnRightAngle' },
  ]),

  // 匹配 !, != 或者 !==
  makeLL1MatchDescriptor('!', [
    { prefix: '!==', tokenClassName: 'notStrictEqual' },
    { prefix: '!=', tokenClassName: 'notEqual' },
    { prefix: '!', tokenClassName: 'exclamation' },
  ]),

  // 匹配 >, >=
  makeLL1MatchDescriptor('>', [
    { prefix: '>=', tokenClassName: 'rightAngleEqual' },
    { prefix: '>', tokenClassName: 'rightAngle' },
  ]),

  // 匹配 <, <|, <=
  makeLL1MatchDescriptor('<', [
    { prefix: '<=', tokenClassName: 'leftAngleEqual' },
    { prefix: '<|', tokenClassName: 'leftAngleColumn' },
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

  // 匹配 ;
  makeLL1MatchDescriptor(';', [{ prefix: ';', tokenClassName: 'semicolumn' }]),

  // 匹配 .
  makeLL1MatchDescriptor('.', [{ prefix: '.', tokenClassName: 'dot' }]),

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
        const windowSkip = 2;
        const windowSize = 2;
        const sentinelPtr = windowSlide(
          buffer,
          windowSkip,
          windowSize,
          (window) => window === '*)',
        );
        if (sentinelPtr + windowSize > buffer.length) {
          const restMatchFn = makeGeneralReceiver(
            (buffer) => buffer.slice(buffer.length - 2, buffer.length) === '*)',
            'comment',
            (buffer) => buffer,
          );
          restMatchFn(buffer, cb, emit, setNext);
        } else {
          const content = buffer.slice(0, sentinelPtr + windowSize);
          const rest = buffer.slice(content.length, buffer.length);
          setNext((char, cb, emit, setNext) =>
            presetStates.default(rest + char, cb, emit, setNext),
          );
          cb();
        }
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
  {
    type: 'll1',
    lookAhead: '"',
    matchFunction: (buffer, cb, emit, setNext) => {
      const windowSkip = 1;
      const windowSize = 2;
      const sentinelPtr = windowSlide(
        buffer,
        windowSkip,
        windowSize,
        (window) => window[0] !== '\\' && window[1] === '"',
      );
      if (sentinelPtr + windowSize > buffer.length) {
        const restMatchFn = makeGeneralReceiver(
          (buffer) =>
            buffer.length >= 2 &&
            buffer[buffer.length - 2] !== '\\' &&
            buffer[buffer.length - 1] === '"',
          'string',
          (buffer) => buffer,
        );
        setNext((char, cb, emit, setNext) =>
          restMatchFn(buffer + char, cb, emit, setNext),
        );
      } else {
        const content = buffer.slice(0, sentinelPtr + 1);
        const rest = buffer.slice(content.length, buffer.length);
        emit({
          content: content,
          tokenClassName: 'string',
        });
        setNext((char, cb, emit, setNext) =>
          presetStates.default(rest + char, cb, emit, setNext),
        );
      }
      cb();
    },
  },

  // 匹配 [
  makeLL1MatchDescriptor('[', [{ prefix: '[', tokenClassName: 'leftSquare' }]),

  // 匹配 ]
  makeLL1MatchDescriptor(']', [{ prefix: ']', tokenClassName: 'rightSquare' }]),
];

const makePatternMatchFn: (_: RegExp, __: TokenType) => MatchFunction = (
  terminateWhenLastCharIsNot,
  tokenClassName,
) => {
  const matchFunction: MatchFunction = (buffer, cb, emit, setNext) => {
    if (terminateWhenLastCharIsNot.test(buffer[buffer.length - 1])) {
      setNext((char, cb, emit, setNext) =>
        matchFunction(buffer + char, cb, emit, setNext),
      );
    } else {
      const content = buffer.slice(0, buffer.length - 1);
      const rest = buffer.slice(content.length, buffer.length);
      emit({ content, tokenClassName });
      setNext((char, cb, emit, setNext) =>
        presetStates.default(rest + char, cb, emit, setNext),
      );
    }
    cb();
  };
  return matchFunction;
};

const patternMatchFuntions: PatternMatchFunctionDescriptor[] = [
  // 匹配数字
  {
    type: 'pattern',
    pattern: /\d/,
    matchFunction: makePatternMatchFn(/\d/, 'number'),
  },

  // 匹配 identifier
  {
    type: 'pattern',
    pattern: /[a-zA-Z]/,
    matchFunction: makePatternMatchFn(/[a-zA-Z\d]/, 'identifier'),
  },

  // 匹配 blank
  {
    type: 'pattern',
    pattern: /\s/,
    matchFunction: makePatternMatchFn(/\s/, 'blank'),
  },
];

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
  const prefixMatchFunctionDescriptor = ll1MatchFunctionMap[buffer[0]];
  if (prefixMatchFunctionDescriptor) {
    prefixMatchFunctionDescriptor.matchFunction(buffer, cb, emit, setNext);
    return;
  }

  const patternFn: MatchFunctionDescriptor | undefined =
    patternMatchFuntions.find((desc) => desc.pattern.test(buffer[0]));
  if (patternFn) {
    patternFn.matchFunction(buffer, cb, emit, setNext);
    return;
  }

  // 若无法找到对应的处理函数，则丢弃该字符，读取下一个字符，再用读取到的下一个字符寻找处理函数
  setNext((char, cb, emit, setNext) =>
    presetStates.default(char, cb, emit, setNext),
  );
  cb();
};

presetStates.default = initialState;
