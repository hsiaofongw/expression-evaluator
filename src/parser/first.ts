import { SetHelper } from 'src/helpers/set-helper';
import { ProductionRule, SymbolType, SyntaxSymbol } from './interfaces';

export class FirstHelper {
  /**
   *
   * @param sbls
   * @param productionRulesMap 假如输入的是一个符号的 id, 则返回以这个符号作为 lhs 的语法产生式的列表
   */
  public static first(
    sbls: SyntaxSymbol[],
    productionRulesMap: Record<SyntaxSymbol['id'], ProductionRule[]>,
  ): {
    symbolIdSet: Set<SyntaxSymbol['id']>;
  } {
    if (sbls.length === 0) {
      return { symbolIdSet: new Set<SyntaxSymbol['id']>([]) };
    }

    const head = sbls[0];
    if (head.type === 'terminal') {
      return { symbolIdSet: new Set<SyntaxSymbol['id']>([head.id]) };
    }

    // 当前 sbls 中的第一个是一个 nonTerminal
    // 记它为 A, 我们要找的所有 A -> x 这样的产生式（x 可以是 epsilon）
    // 检查每一个这样的 x 的 First 集，如果有空的（也就是说 A *=> eps），那么，我们还要再计算 sbls[1..] 的 First

    const rules = productionRulesMap[head.id];
    const firstResults = rules.map((rule) =>
      FirstHelper.first(rule.rhs, productionRulesMap),
    );

    const firstUnion: Set<SymbolType> = firstResults
      .map((x) => x.symbolIdSet)
      .reduce((a, b) => SetHelper.union(a, b));

    for (const res of firstResults) {
      if (res.symbolIdSet.size === 0) {
        // rules 中存在 A -> eps 这样的

        const rest = FirstHelper.first(
          sbls.slice(1, sbls.length),
          productionRulesMap,
        );

        return { symbolIdSet: SetHelper.union(firstUnion, rest.symbolIdSet) };
      }
    }

    // 到了这，说明 A 推不出 eps

    return { symbolIdSet: firstUnion };
  }
}
