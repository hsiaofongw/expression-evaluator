import { ArrayHelper } from 'src/helpers/to-array';
import { ProductionRule, SyntaxSymbol } from './interfaces';

export class SyntaxSymbolHelper {
  private _symbols: SyntaxSymbol[] = [];
  private _rules: ProductionRule[] = [];
  private _rulesMap: Record<SyntaxSymbol['id'], ProductionRule[]> = {};
  private _symbolMap: Record<SyntaxSymbol['id'], SyntaxSymbol> = {};

  constructor(config: {
    symbols: SyntaxSymbol[] | Record<string, SyntaxSymbol>;
    rules: ProductionRule[];
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
            if (fistSymbol.id === 'epsilon') {
              checkList.push(restSymbols);
            }
            break;
          default:
            break;
        }
      }
    }

    return terminalIdSet;
  }

  public follow(symbol: SyntaxSymbol): SyntaxSymbol[] {
    return [];
  }

  public isInFollow(
    symbol: SyntaxSymbol,
    terminalSymbol: SyntaxSymbol,
  ): boolean {
    return false;
  }

  public followIdSet(symbol: SyntaxSymbol): Set<string> {
    return new Set<string>([]);
  }
}
