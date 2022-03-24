import { SetHelper } from 'src/helpers/set-helper';
import { sbl } from './config';
import { ProductionRule, SymbolType, SyntaxSymbol } from './interfaces';

/** 提供计算 FIRST, EPS, FOLLOW 和 PREDICT 的方法 */
export class PredictHelper {
  public static epsilon(
    symbols: SyntaxSymbol[],
    rules: ProductionRule[],
  ): boolean {
    if (symbols.length === 0) {
      return true;
    }

    const head = symbols[0];
    if (head.type === 'terminal') {
      return false;
    }

    for (const rule of rules) {
      if (rule.lhs.id === head.id) {
        const rhs = rule.rhs;
        if (PredictHelper.epsilon(rhs, rules)) {
          return PredictHelper.epsilon(symbols.slice(1, symbols.length), rules);
        }
      }
    }

    return false;
  }

  /**
   *
   * @param sbls
   * @param productionRulesMap 假如输入的是一个符号的 id, 则返回以这个符号作为 lhs 的语法产生式的列表
   */
  public static first(
    sbls: SyntaxSymbol[],
    productionRules: ProductionRule[],
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

    const rules = productionRules.filter((rule) => rule.lhs.id === head.id);
    const firstResults = rules.map((rule) =>
      PredictHelper.first(rule.rhs, productionRules),
    );

    const firstUnion: Set<SymbolType> = firstResults
      .map((x) => x.symbolIdSet)
      .reduce((a, b) => SetHelper.union(a, b));

    for (const res of firstResults) {
      if (res.symbolIdSet.size === 0) {
        // rules 中存在 A -> eps 这样的

        const rest = PredictHelper.first(
          sbls.slice(1, sbls.length),
          productionRules,
        );

        return { symbolIdSet: SetHelper.union(firstUnion, rest.symbolIdSet) };
      }
    }

    // 到了这，说明 A 推不出 eps

    return { symbolIdSet: firstUnion };
  }

  public static calculateFollowSet(
    productionRules: ProductionRule[],
  ): Record<SyntaxSymbol['id'], Set<SyntaxSymbol['id']>> {
    const makeEmptySet: () => Set<SyntaxSymbol['id']> = () =>
      new Set<SyntaxSymbol['id']>();
    const result: Record<
      SyntaxSymbol['id'],
      Set<SyntaxSymbol['id']>
    > = {} as any;
    result[sbl.start.id] = new Set<SyntaxSymbol['id']>([sbl.eof.id]); // Follow(S) = { $$ };
    let updated = true;
    while (updated) {
      updated = false;
      for (const rule of productionRules) {
        const lhs = rule.lhs;
        const rhs = rule.rhs;
        for (let i = 0; i < rhs.length; i++) {
          const x = rhs[i];
          let beta: SyntaxSymbol[] = [];
          if (i <= rhs.length - 1) {
            beta = rhs.slice(i + 1, rhs.length);
          }

          if (
            beta.length === 0 ||
            PredictHelper.epsilon(beta, productionRules)
          ) {
            // A -> alpha B beta, beta *=> epsilon, or A -> alpha B
            const followA = result[lhs.id] ?? makeEmptySet();
            if (result[x.id] === undefined) {
              result[x.id] = makeEmptySet();
            }
            for (const followToken of followA) {
              result[x.id].add(followToken);
              updated = true;
            }
          } else {
            // A -> alpha B beta, beta *=>/ epsilon
            const firstBeta = PredictHelper.first(
              beta,
              productionRules,
            ).symbolIdSet;
            if (result[x.id] === undefined) {
              result[x.id] = makeEmptySet();
            }

            for (const sblId of firstBeta) {
              updated = true;
              result[x.id].add(sblId);
            }
          }
        }
      }
    }

    return result;
  }
}
