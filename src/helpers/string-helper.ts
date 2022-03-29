import { Token } from 'src/new-lexer/interfaces';
import { Transform } from 'stream';

const hexToString = (s: string) => Buffer.from(s, 'hex').toString('utf8');
const escapeTable: Record<string, string> = {
  a: hexToString('07'),
  b: hexToString('08'),
  e: hexToString('1B'),
  f: hexToString('0C'),
  n: hexToString('0A'),
  r: hexToString('0D'),
  t: hexToString('09'),
  v: hexToString('0B'),
  '\\': hexToString('5C'),
  "'": hexToString('27'),
  '"': hexToString('22'),
  '?': hexToString('3F'),
};

export class StringHelper {
  public static makeCharSplitTransform(): Transform {
    return new Transform({
      objectMode: true,
      transform(chunk: string, encoding, callback) {
        chunk.split('').forEach((char) => this.push(char as string));

        callback();
      },
    });
  }

  public static makeStripTransform(
    dropTokenId: Token['tokenClassName'],
  ): Transform {
    return new Transform({
      objectMode: true,
      transform(chunk: Token, encoding, callback) {
        if (chunk.tokenClassName === dropTokenId) {
          callback();
        } else {
          this.push(chunk);
          callback();
        }
      },
    });
  }

  public static makeStringEscapeTransform(): Transform {
    return new Transform({
      objectMode: true,
      transform(chunk: Token, encoding, callback) {
        if (chunk.tokenClassName !== 'string') {
          this.push(chunk);
          callback();
          return;
        }

        const inputChunkString = chunk.content.slice(
          1,
          chunk.content.length - 1,
        );
        const windowSize = 2;
        const windowSkip = 0;
        const resultStringBuffer: string[] = new Array<string>(
          inputChunkString.length,
        ).fill('');
        if (inputChunkString.length) {
          resultStringBuffer[0] = inputChunkString[0];
        }
        let sbPtr = 0;
        let windowPtr = windowSkip;
        while (windowPtr + windowSize <= inputChunkString.length) {
          const window = inputChunkString.slice(
            windowPtr,
            windowPtr + windowSize,
          );

          if (window[0] === '\\') {
            resultStringBuffer[sbPtr] = escapeTable[window[1]] ?? window[1];
            if (windowPtr + windowSize <= inputChunkString.length - 1) {
              resultStringBuffer[sbPtr + 1] =
                inputChunkString[windowPtr + windowSize];
            }
            windowPtr = windowPtr + 2;
          } else {
            resultStringBuffer[sbPtr] = window[0];
            resultStringBuffer[sbPtr + 1] = window[1];
            windowPtr = windowPtr + 1;
          }

          sbPtr = sbPtr + 1;
        }

        const resultToken: Token = {
          content: resultStringBuffer.join(''),
          tokenClassName: chunk.tokenClassName,
        };
        this.push(resultToken);
        callback();
      },
    });
  }

  public static processRawStringEscape(rawString: string): string {
    let result = '';
    for (let i = 0; i < rawString.length; i++) {
      if (
        rawString[i] === '\\' &&
        i <= rawString.length - 2 &&
        escapeTable[rawString[i + 1]]
      ) {
        result = result + escapeTable[rawString[i + 1]];
      } else {
        result = result + rawString;
      }
    }

    return result;
  }
}
