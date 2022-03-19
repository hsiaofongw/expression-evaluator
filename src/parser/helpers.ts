import { ArrayHelper } from 'src/helpers/array-helper';
import {
  allRules,
  allSymbols,
  nonTerminalSymbols,
  terminalSymbols,
} from './config';
import {
  PredictiveAnalysisTable,
  ProductionRule,
  ProductionRuleId,
  SyntaxAnalysisConfiguration,
  SyntaxConfiguration,
  SyntaxSymbol,
} from './interfaces';

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
  private _predictiveAnalysisTable!: PredictiveAnalysisTable;
  private _patCalculated = false;
  private _firstIdSetMultikeyCache: Record<string, Set<string>> = {};

  public get entrySymbol(): SyntaxSymbol {
    return this._entrySymbol;
  }

  public get epsilonSymbol(): SyntaxSymbol {
    return this._epsilonSymbol;
  }

  public get endOfFileSymbol(): SyntaxSymbol {
    return this._endOfFileSymbol;
  }

  constructor(config: SyntaxConfiguration) {
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

  public printPredictiveTable(): void {
    for (const nonTerminalSbl of nonTerminalSymbols) {
      for (const terminalSbl of terminalSymbols) {
        const rules = this.getRulesFromPAT(nonTerminalSbl, terminalSbl);
        const nonTerminal = nonTerminalSbl.displayName ?? nonTerminalSbl.name;
        const terminal = terminalSbl.displayName ?? terminalSbl.name;
        const header = `[ ${nonTerminal}, ${terminal} ]: `;
        const spacePadding = ' '.repeat(header.length);
        const body = rules
          .map((rule) => {
            const lhs = rule.lhs.displayName ?? rule.lhs.name;
            const rhs = rule.rhs
              .map((sbl) => sbl.displayName ?? sbl.name)
              .join(' ');
            return `${lhs} -> ${rhs}`;
          })
          .join('\n' + spacePadding);
        console.log(header + body);
      }
    }
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

  public getRulesFromPAT(
    currentSymbol: SyntaxSymbol,
    inputSymbol: SyntaxSymbol,
  ): ProductionRule[] {
    const rules: ProductionRule[] = [];

    if (!this._patCalculated) {
      this._calculatePredictiveAnalysisTable();
    }

    const table = this._predictiveAnalysisTable;
    if (table[currentSymbol.id]) {
      if (table[currentSymbol.id][inputSymbol.id]) {
        const entries = table[currentSymbol.id][inputSymbol.id];
        for (const ruleId of entries) {
          const rule = this.getProductionRuleFromId(ruleId);
          rules.push(rule);
        }
      }
    }

    return rules;
  }

  public getPredictiveAnalysisTable(): PredictiveAnalysisTable {
    const table: PredictiveAnalysisTable = {};

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
    const table: PredictiveAnalysisTable = {};

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

  /** 在控制台打印出语法产生式规则 */
  public printProductionRules(): void {
    console.log(
      this.getProductionRulesPreview(
        (sbl) => sbl.displayName ?? sbl.name ?? sbl.zhName ?? sbl.id,
      ),
    );
  }

  /** 得到在控制台打印出语法产生式规则内容 */
  public getProductionRulesPreview(
    symbolNamePicker: (sbl: SyntaxSymbol) => string,
  ): string {
    const rules = this._rules;

    // we wont just simply print the .name attribute,
    // because .name is just a id

    // a more precise way is to print symbols name

    // group by lhs symbol
    const groupByLhs: Record<string, ProductionRule[]> = {};
    for (const rule of rules) {
      const lhs = rule.lhs;
      if (groupByLhs[lhs.id] === undefined) {
        groupByLhs[lhs.id] = [];
      }

      groupByLhs[lhs.id].push(rule);
    }

    const paddingBetweenSbl = ' '.repeat(2);
    const groupsContent: string[] = [];
    for (const lhsId in groupByLhs) {
      const rules = groupByLhs[lhsId];
      const firstRule = rules[0];
      const lhs = firstRule.lhs;
      const lhsDisplay = symbolNamePicker(lhs);
      const headerPart = `${lhsDisplay}${paddingBetweenSbl}->${paddingBetweenSbl}`;
      const spacePadding = ' '.repeat(
        headerPart.length - paddingBetweenSbl.length - 1,
      );
      const getDisplayFromRhs = (sbls: SyntaxSymbol[]): string => {
        return sbls.map((sbl) => symbolNamePicker(sbl)).join(paddingBetweenSbl);
      };
      const bodyPart = rules
        .map((rule) => rule.rhs)
        .map((rhs) => getDisplayFromRhs(rhs))
        .join('\n' + spacePadding + '|' + paddingBetweenSbl);
      const ruleGroupContent = `${headerPart}${bodyPart}`;
      groupsContent.push(ruleGroupContent);
    }

    return groupsContent.join('\n\n');
  }
}

export const syntaxConfiguration: SyntaxConfiguration = {
  symbols: allSymbols,
  rules: allRules,
  specialSymbol: {
    entrySymbol: allSymbols.start,
    epsilonSymbol: allSymbols.epsilon,
    endOfFileSymbol: allSymbols.endOfFile,
  },
};

export const symbolHelper = new SyntaxSymbolHelper(syntaxConfiguration);

export const syntaxAnalysisConfiguration: SyntaxAnalysisConfiguration = {
  ...syntaxConfiguration,
  syntaxAnalysisPartner: symbolHelper,
};
