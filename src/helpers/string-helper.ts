export class StringHelper {
  public static processRawStringEscape(rawString: string): string {
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
