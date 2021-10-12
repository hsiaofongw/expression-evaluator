type Separator = {
  regex: RegExp;
  name: string;
};

/** 词素 */
type Token = {
  startIndex: number;
  length: number;
  content: string;
  name: string;
};

const separators: Separator[] = [
  {
    regex: /\s+/g,
    name: "Space",
  },
  {
    regex: /=/g,
    name: "EqualSign",
  },
];

const separatorNames = new Set<string>();
separators.forEach(sep => separatorNames.add(sep.name));

const testString = "node /src/app.js      --abc --cd=efg --h=ij -j";
const initialToken: Token = {
  startIndex: 0,
  content: testString,
  length: testString.length,
  name: "Token",
};
let tokens: Token[] = [initialToken];
for (const separator of separators) {
  const newTokens = new Array<Token>();
  for (const activeToken of tokens) {
    console.log(activeToken.name);

    if (separatorNames.has(activeToken.name)) {
      newTokens.push(activeToken);
      continue;
    }

    const matchResults = activeToken.content.matchAll(separator.regex);
    let prevSeparatorIdx = 0;
    let prevSeparatorLen = 0;
    for (const matchResult of matchResults) {
      const tokenStartIdx = prevSeparatorIdx + prevSeparatorLen;
      const currentSeparatorIdx = matchResult.index as number;
      const tokenContent = activeToken.content.slice(
        tokenStartIdx,
        currentSeparatorIdx
      );
      prevSeparatorIdx = currentSeparatorIdx;
      prevSeparatorLen = matchResult[0].length as number;

      if (tokenContent.length) {
        newTokens.push({
          startIndex: tokenStartIdx + activeToken.startIndex,
          length: tokenContent.length,
          content: tokenContent,
          name: "Token",
        });

        console.log(newTokens);
      }

      newTokens.push({
        startIndex: currentSeparatorIdx+activeToken.startIndex,
        length: matchResult[0].length as number,
        content: matchResult[0] as string,
        name: separator.name.toString(),
      });
      console.log(newTokens);
    }
    const lastTokenStartIdx = prevSeparatorIdx + prevSeparatorLen;
    const lastTokenContent = activeToken.content.slice(
      lastTokenStartIdx,
      activeToken.content.length
    );
    newTokens.push({
      startIndex: activeToken.startIndex + lastTokenStartIdx,
      length: lastTokenContent.length,
      content: lastTokenContent,
      name: "Token",
    });
  }
  console.log(tokens);
  tokens = newTokens;
}

console.log({ tokens });
