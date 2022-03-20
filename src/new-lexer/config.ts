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

  // 匹配 |>, ||
  makeLL1MatchDescriptor('|', [
    { prefix: '||', tokenClassName: 'or' },
    { prefix: '|>', tokenClassName: 'columnRightAngle' },
  ]),

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
  {
    type: 'll1',
    lookAhead: '"',
    matchFunction: (buffer, cb, emit, setNext) => {
      const processString: MatchFunction = (buffer, cb, emit, setNext) => {
        setNext((char, cb, emit, setNext) => {
          if (char === '"') {
            emit({ content: buffer, tokenClassName: 'string' });
            setNext(presetStates.default);
            cb();
          } else if (char === '\\') {
            setNext((char, cb, emit, setNext) => {
              processString(
                buffer + StringHelper.processRawStringEscape('\\' + char),
                cb,
                emit,
                setNext,
              );
            });
            cb();
          } else {
            processString(buffer + char, cb, emit, setNext);
          }
        });
        cb();
      };

      let modifiedBuffer = '';
      for (let i = 1; i < buffer.length; i++) {
        if (buffer[i] === '"') {
          emit({
            content: modifiedBuffer,
            tokenClassName: 'string',
          });
          setNext((char, cb, emit, setNext) =>
            presetStates.default(
              buffer.slice(i + 1, buffer.length),
              cb,
              emit,
              setNext,
            ),
          );
          cb();
          return;
        } else if (buffer[i] === '\\' && i === buffer.length - 1) {
          setNext((char, cb, emit, setNext) => {
            const escaped = StringHelper.processRawStringEscape('\\' + char);
            processString(modifiedBuffer + escaped, cb, emit, setNext);
          });
          cb();
          return;
        } else if (buffer[i] === '\\' && i <= buffer.length - 2) {
          modifiedBuffer =
            modifiedBuffer +
            StringHelper.processRawStringEscape('\\' + buffer[i + 1]);
          i = i + 1;
        } else {
          modifiedBuffer = modifiedBuffer + buffer[i];
        }
      }
      processString(modifiedBuffer, cb, emit, setNext);
    },
  },

  // 匹配 [
  makeLL1MatchDescriptor('[', [{ prefix: '[', tokenClassName: 'leftSquare' }]),

  // 匹配 ]
  makeLL1MatchDescriptor(']', [{ prefix: ']', tokenClassName: 'rightSquare' }]),
];

const makeReceiver: (
  regex: RegExp,
  tokenClassName: TokenType,
) => MatchFunction = (regex, tokenClassName) => {
  const matchFunction: MatchFunction = (buffer, cb, emit, setNext) => {
    if (regex.test(buffer[buffer.length - 1])) {
      setNext((char, cb, emit, setNext) => {
        matchFunction(buffer + char, cb, emit, setNext);
      });
    } else {
      emit({
        content: buffer.slice(0, buffer.length - 1),
        tokenClassName: tokenClassName,
      });
      setNext((char, cb, emit, setNext) => {
        presetStates.default(
          buffer[buffer.length - 1] + char,
          cb,
          emit,
          setNext,
        );
      });
    }
    cb();
  };
  return matchFunction;
};

const patternMatchFuntions: PatternMatchFunctionDescriptor[] = [
  // 匹配数字
  {
    type: 'pattern',
    pattern: /[\d.]/,
    matchFunction: (buffer, cb, emit, setNext) => {
      const matchNumber: MatchFunction = makeReceiver(/[\d.]/, 'number');
      setNext((char, cb, emit, setNext) => {
        matchNumber(
          buffer + char,
          cb,
          (token) => {
            // 如果有小数点，忽略掉第一个小数点后面出现的所有小数点
            for (let i = 0; i < token.content.length; i++) {
              if (token.content[i] === '.') {
                emit({
                  content:
                    token.content.slice(0, i) +
                    token.content
                      .slice(i, token.content.length)
                      .replace(/\./g, ''),
                  tokenClassName: 'number',
                });
                return;
              }
            }
            emit(token);
          },
          setNext,
        );
      });
      cb();
    },
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
  if (ll1MatchFunctionMap[buffer[0]]) {
    ll1MatchFunctionMap[buffer].matchFunction(buffer, cb, emit, setNext);
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
