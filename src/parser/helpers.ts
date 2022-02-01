import { ArrayHelper } from 'src/helpers/to-array';
import { ProductionRule, ProductionRuleId, SyntaxSymbol } from './interfaces';

export class SyntaxSymbolHelper {
  private _symbols: SyntaxSymbol[] = [];
  private _rules: ProductionRule[] = [];
  private _rulesMap: Record<SyntaxSymbol['id'], ProductionRule[]> = {};
  private _symbolMap: Record<SyntaxSymbol['id'], SyntaxSymbol> = {};
  private _entrySymbol!: SyntaxSymbol;
  private _epsilonSymbol!: SyntaxSymbol;
  private _endOfFileSymbol!: SyntaxSymbol;
  private _symbolIdToFollowIdSet!: Record<SyntaxSymbol['id'], Set<string>>;
  private _followSetIsCalculated = false;
  private _predictiveAnalysisTable!: Record<
    SyntaxSymbol['id'],
    Record<SyntaxSymbol['id'], ProductionRuleId[]>
  >;
  private _patCalculated = false;
  private _firstIdSetMultikeyCache: Record<string, Set<string>> = {};

  constructor(config: {
    symbols: SyntaxSymbol[] | Record<string, SyntaxSymbol>;
    rules: ProductionRule[];
    specialSymbol: {
      entrySymbol: SyntaxSymbol;
      epsilonSymbol: SyntaxSymbol;
      endOfFileSymbol: SyntaxSymbol;
    };
  }) {
    this._symbols = Array.isArray(config.symbols)
      ? config.symbols
      : ArrayHelper.toArray(config.symbols);
    this._rules = config.rules;

    this._rulesMap = {};
    const rulesMap = this._rulesMap;
    for (const rule of this._rules) {
      if (rulesMap[rule.lhs.id] === undefined) {
        rulesMap[rule.lhs.id] = [];
      }
      rulesMap[rule.lhs.id].push(rule);
    }

    this._symbolMap = {};
    const symbolMap = this._symbolMap;
    for (const symbol of this._symbols) {
      symbolMap[symbol.id] = symbol;
    }

    this._entrySymbol = config.specialSymbol.entrySymbol;
    this._epsilonSymbol = config.specialSymbol.epsilonSymbol;
    this._endOfFileSymbol = config.specialSymbol.endOfFileSymbol;
    this._symbolIdToFollowIdSet = {};
    this._followSetIsCalculated = false;
    this._predictiveAnalysisTable = {};
    this._patCalculated = false;
  }

  public first(symbols: SyntaxSymbol[]): SyntaxSymbol[] {
    const symbolIds: string[] = [];
    const symbolIdSet = this._firstIdSet(symbols);
    for (const id of symbolIdSet) {
      symbolIds.push(id);
    }

    return symbolIds.map((id) => this._symbolMap[id]);
  }

  public firstIdSet(symbols: SyntaxSymbol[]): Set<string> {
    return this._firstIdSet(symbols);
  }

  public isInFirst(
    symbols: SyntaxSymbol[],
    terminalSymbol: SyntaxSymbol,
  ): boolean {
    const idSet = this._firstIdSet(symbols);
    return idSet.has(terminalSymbol.id);
  }

  private _firstIdSet(symbols: SyntaxSymbol[]): Set<string> {
    const cacheKey = JSON.stringify(symbols.map((symbol) => symbol.id));
    if (this._firstIdSetMultikeyCache[cacheKey]) {
      return this._firstIdSetMultikeyCache[cacheKey];
    }

    const terminalIdSet = new Set<string>();
    const checkList: SyntaxSymbol[][] = [symbols];
    while (checkList.length > 0) {
      const check = checkList.pop() as any as SyntaxSymbol[];
      if (check.length > 0) {
        const fistSymbol = check[0];
        const restSymbols = check.slice(1, check.length);
        switch (fistSymbol.type) {
          case 'nonTerminal':
            const rules = this._rulesMap[fistSymbol.id];
            for (const rule of rules) {
              checkList.push([...rule.rhs, ...restSymbols]);
            }
            break;
          case 'terminal':
            terminalIdSet.add(fistSymbol.id);
            if (fistSymbol.id === this._epsilonSymbol.id) {
              checkList.push(restSymbols);
            }
            break;
          default:
            break;
        }
      }
    }

    this._firstIdSetMultikeyCache[cacheKey] = terminalIdSet;
    return terminalIdSet;
  }

  public follow(symbol: SyntaxSymbol): SyntaxSymbol[] {
    const followSymbols: SyntaxSymbol[] = [];
    const idSet = this._followIdSet(symbol);
    for (const id of idSet) {
      followSymbols.push(this._symbolMap[id]);
    }

    return followSymbols;
  }

  public isInFollow(
    symbolToFollow: SyntaxSymbol,
    anySymbol: SyntaxSymbol,
  ): boolean {
    const idSet = this._followIdSet(symbolToFollow);
    return idSet.has(anySymbol.id);
  }

  private _followIdSet(symbol: SyntaxSymbol): Set<string> {
    if (!this._followSetIsCalculated) {
      this._calculateFollowSet();
    }

    const emptySet = new Set<string>();
    return this._symbolIdToFollowIdSet[symbol.id] ?? emptySet;
  }

  private _calculateFollowSet(): void {
    // key 是符号的 id, value 是一个关于符号的 id 的 set
    const symbolIdToFollowIdSet: Record<SyntaxSymbol['id'], Set<string>> = {};

    // 对于开始符号 E, 添加 EOF 到 FOLLOW(E)
    symbolIdToFollowIdSet[this._entrySymbol.id] = new Set<string>();
    symbolIdToFollowIdSet[this._entrySymbol.id].add(this._endOfFileSymbol.id);

    // 添加 EOF 到新增 FOLLOW 符号集
    let newlyAddedIdSet = new Set<string>();
    newlyAddedIdSet.add(this._endOfFileSymbol.id);

    // 只有当没有新增 FOLLOW 符号时才停止
    while (newlyAddedIdSet.size > 0) {
      newlyAddedIdSet = new Set<string>();

      for (const rule of this._rules) {
        // for each rule like: lhs -> rhs
        const lhs = rule.lhs;
        const rhs = rule.rhs;

        if (symbolIdToFollowIdSet[lhs.id] === undefined) {
          symbolIdToFollowIdSet[lhs.id] = new Set<string>();
        }
        const followLhs = symbolIdToFollowIdSet[lhs.id];

        // for each lhs -> alpha b beta in lhs -> rhs, where alpha, beta are possibly empty symbol(s)
        for (let i = 0; i < rhs.length; i++) {
          const b = rhs[i];
          const betas = rhs.slice(i + 1, rhs.length);
          if (symbolIdToFollowIdSet[b.id] === undefined) {
            symbolIdToFollowIdSet[b.id] = new Set<string>();
          }
          const followB = symbolIdToFollowIdSet[b.id];

          if (betas.length === 0) {
            // beta is empty symbol(s)

            // 将 FOLLOW(lhs) 添加到 FOLLOW(b)
            for (const item of followLhs) {
              // 新增的
              if (!followB.has(item)) {
                newlyAddedIdSet.add(item);
              }

              followB.add(item);
            }
          } else {
            // beta is non-empty
            const firstBeta = this._firstIdSet(betas);
            if (firstBeta.has(this._epsilonSymbol.id)) {
              // epsilon in FIRST(beta)

              // add all FOLLOW(lhs) into FOLLOW(b)
              for (const item of followLhs) {
                if (!followB.has(item)) {
                  newlyAddedIdSet.add(item);
                }

                followB.add(item);
              }
            }

            // add all non-epsilon in FIRST(beta) into FOLLOW(b)
            for (const item of firstBeta) {
              if (item !== this._epsilonSymbol.id) {
                if (!followB.has(item)) {
                  newlyAddedIdSet.add(item);
                }

                followB.add(item);
              }
            }
          }
        }
      }
    }

    this._symbolIdToFollowIdSet = symbolIdToFollowIdSet;
    this._followSetIsCalculated = true;
  }

  public getProductionRuleFromId(
    productionRuleId: ProductionRuleId,
  ): ProductionRule {
    return this._rules[productionRuleId];
  }

  public getPredictiveAnalysisTable(): Record<
    SyntaxSymbol['id'],
    Record<SyntaxSymbol['id'], ProductionRuleId[]>
  > {
    const table: Record<
      SyntaxSymbol['id'],
      Record<SyntaxSymbol['id'], ProductionRuleId[]>
    > = {};

    if (!this._patCalculated) {
      this._calculatePredictiveAnalysisTable();
    }

    // make a deep copy, in case downstream change it.
    for (const rowId in this._predictiveAnalysisTable) {
      table[rowId] = {};
      for (const colId in this._predictiveAnalysisTable[rowId]) {
        table[rowId][colId] = this._predictiveAnalysisTable[rowId][colId].map(
          (x) => x,
        );
      }
    }

    return table;
  }

  private _calculatePredictiveAnalysisTable(): void {
    const table: Record<
      SyntaxSymbol['id'],
      Record<SyntaxSymbol['id'], ProductionRuleId[]>
    > = {};

    for (let i = 0; i < this._rules.length; i++) {
      const ruleId = i;
      const rule = this._rules[i];
      const lhs = rule.lhs;
      const rhs = rule.rhs;

      const firstRhs = this._firstIdSet(rhs);
      const followLhs = this._followIdSet(lhs);
      for (const a of firstRhs) {
        // for every terminal symbol a in FIRST(rhs), add lhs -> rhs into table[lhs, a]
        const symbol = this._symbolMap[a];
        if (symbol.type === 'terminal') {
          if (table[lhs.id] === undefined) {
            table[lhs.id] = {};
          }

          if (table[lhs.id][a] === undefined) {
            table[lhs.id][a] = [];
          }
          table[lhs.id][a].push(ruleId);
        }

        // if epsilon in FIRST(rhs)
        if (firstRhs.has(this._epsilonSymbol.id)) {
          // then for every terminal symbol b in FOLLOW(lhs), add lhs -> rhs into table[lhs, b]

          for (const b of followLhs) {
            const symbol = this._symbolMap[b];
            if (symbol.type === 'terminal') {
              if (table[lhs.id] === undefined) {
                table[lhs.id] = {};
              }

              if (table[lhs.id][b] === undefined) {
                table[lhs.id][b] = [];
              }
              table[lhs.id][b].push(ruleId);
            }
          }

          // if epsilon in FIRST(rhs) and $ in FOLLOW(lhs), add lhs -> rhs into table[lhs, $]
          if (followLhs.has(this._endOfFileSymbol.id)) {
            if (table[lhs.id] === undefined) {
              table[lhs.id] = {};
            }

            if (table[lhs.id][this._endOfFileSymbol.id] === undefined) {
              table[lhs.id][this._endOfFileSymbol.id] = [];
            }
            table[lhs.id][this._endOfFileSymbol.id].push(ruleId);
          }
        }
      }
    }

    this._predictiveAnalysisTable = table;
    this._patCalculated = true;
  }
}
