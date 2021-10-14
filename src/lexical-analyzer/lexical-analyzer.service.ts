import { Inject, Injectable } from '@nestjs/common';
import { Separator, IToken, TokenizeResult, TokenGroup } from 'src/tokens';

/** 词法分析器 */
@Injectable()
export class LexicalAnalyzer {
  constructor(@Inject('SEPARATORS') private separators: Separator[]) {}

  tokenize(text: string): TokenizeResult {
    const separators = this.separators;
    const separatorNames = new Set<string>();
    this.separators.forEach((sep) => separatorNames.add(sep.name));

    const initialToken: IToken = {
      startIndex: 0,
      content: text,
      length: text.length,
      name: 'Token',
    };
    let tokens: IToken[] = [initialToken];
    for (const separator of separators) {
      const newTokens = new Array<IToken>();
      for (const activeToken of tokens) {
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
            currentSeparatorIdx,
          );
          prevSeparatorIdx = currentSeparatorIdx;
          prevSeparatorLen = matchResult[0].length as number;

          if (tokenContent.length) {
            newTokens.push({
              startIndex: tokenStartIdx + activeToken.startIndex,
              length: tokenContent.length,
              content: tokenContent,
              name: 'Token',
            });
          }

          newTokens.push({
            startIndex: currentSeparatorIdx + activeToken.startIndex,
            length: matchResult[0].length as number,
            content: matchResult[0] as string,
            name: separator.name.toString(),
          });
        }
        const lastTokenStartIdx = prevSeparatorIdx + prevSeparatorLen;
        const lastTokenContent = activeToken.content.slice(
          lastTokenStartIdx,
          activeToken.content.length,
        );
        if (lastTokenContent.length) {
          newTokens.push({
            startIndex: activeToken.startIndex + lastTokenStartIdx,
            length: lastTokenContent.length,
            content: lastTokenContent,
            name: 'Token',
          });
        }
      }
      tokens = newTokens;
    }

    const tokenGroup = TokenGroup.createFromTokens(tokens);

    return { tokenGroup };
  }
}
