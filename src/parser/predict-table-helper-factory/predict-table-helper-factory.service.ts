import { Injectable, Logger } from '@nestjs/common';
import { Token } from 'src/new-lexer/interfaces';
import {
  ILanguageSpecification,
  ProductionRule,
  SyntaxSymbol,
} from '../interfaces';

export class PredictTableHelper {
  /** 输入：lhs 的 id, 输出：所有以 lhs 为左边符号的产生式 */
  private rulesMap: Record<SyntaxSymbol['id'], ProductionRule[]> = {} as any;

  /** 输入：符号 id, 输出：此符号的 Follow 集（集合里边的每个元素是符号 id） */
  private followMap: Record<SyntaxSymbol['id'], Set<SyntaxSymbol['id']>> =
    {} as any;

  /** 输入：产生式的 name（产生式的 name 可作为产生式的唯一标识符），输出：该产生式的预测集 */
  private predictRuleMap: Record<
    ProductionRule['name'],
    Set<SyntaxSymbol['id']>
  > = {} as any;

  constructor(private speficiation: ILanguageSpecification) {
    this.init();
  }

  private init(): void {
    for (const rule of this.speficiation.productionRules) {
      const key = rule.lhs.id;
      if (this.rulesMap[key] === undefined) {
        this.rulesMap[key] = [];
      }
      this.rulesMap[key].push(rule);
    }

    this.calculateFollowTable();
    this.calculatePredictTable();
  }

  private calculateFollowTable(): void {
    this.followMap = {} as any;
    this.addFollowRuleById(
      this.speficiation.startSymbol.id,
      this.speficiation.endOfFileSymbol.id,
    );

    while (true) {
      let added = 0;

      for (const rule of this.speficiation.productionRules) {
        for (let i = 0; i < rule.rhs.length; i++) {
          const alpha = rule.lhs;
          const B = rule.rhs[i];
          const beta = rule.rhs.slice(i + 1, rule.rhs.length);

          const firstSetOfBeta = this.first(beta);
          for (const sblId of firstSetOfBeta) {
            added = added + this.addFollowRuleById(B.id, sblId);
          }

          if (beta.length === 0 || this.epsilon(beta)) {
            const followSetOfAlpha = this.getFollowSetById(alpha.id);
            for (const sblId of followSetOfAlpha) {
              added = added + this.addFollowRuleById(B.id, sblId);
            }
          }
        }
      }

      if (added === 0) {
        return;
      }
    }
  }

  private getFollowSetById(
    symbolId: SyntaxSymbol['id'],
  ): Set<SyntaxSymbol['id']> {
    if (this.followMap[symbolId] === undefined) {
      this.followMap[symbolId] = new Set<SyntaxSymbol['id']>();
    }
    return this.followMap[symbolId];
  }

  private addFollowRuleById(
    symbolXId: SyntaxSymbol['id'],
    symbolYId: SyntaxSymbol['id'],
  ): number {
    let added = 0;
    const followSet = this.getFollowSetById(symbolXId);
    if (!followSet.has(symbolYId)) {
      added = 1;
    }
    followSet.add(symbolYId);
    return added;
  }

  private getRulesByLhsId(lhsId: SyntaxSymbol['id']): ProductionRule[] {
    return this.rulesMap[lhsId] ?? [];
  }

  /**
   * return true if and only if symbols *=> eps
   */
  private epsilon(symbols: SyntaxSymbol[]): boolean {
    if (symbols.length === 0) {
      return true;
    }

    const head = symbols[0];
    if (head.type === 'terminal') {
      return false;
    }

    const rules = this.speficiation.productionRules.filter(
      (rule) => rule.lhs.id === head.id,
    );
    for (const rule of rules) {
      if (this.epsilon(rule.rhs)) {
        return this.epsilon(symbols.slice(1, symbols.length));
      }
    }

    return false;
  }

  private first(symbols: SyntaxSymbol[]): Set<SyntaxSymbol['id']> {
    const firstSblIdSet = new Set<SyntaxSymbol['id']>();

    if (symbols.length === 0) {
      return firstSblIdSet;
    }

    const head = symbols[0];
    if (head.type === 'terminal') {
      firstSblIdSet.add(head.id);
      return firstSblIdSet;
    }

    let shouldContinue = false;
    const rules = this.getRulesByLhsId(head.id);
    for (const rule of rules) {
      const firstSetForRhs = this.first(rule.rhs);
      if (this.epsilon(rule.rhs)) {
        shouldContinue = true;
      }
      for (const id of firstSetForRhs) {
        firstSblIdSet.add(id);
      }
    }

    if (shouldContinue) {
      const restSbls = symbols.slice(1, symbols.length);
      const restFstSet = this.first(restSbls);
      for (const item of restFstSet) {
        firstSblIdSet.add(item);
      }
    }

    return firstSblIdSet;
  }

  private getPredictSet(
    ruleName: ProductionRule['name'],
  ): Set<SyntaxSymbol['id']> {
    if (this.predictRuleMap[ruleName] === undefined) {
      this.predictRuleMap[ruleName] = new Set<SyntaxSymbol['id']>();
    }
    return this.predictRuleMap[ruleName];
  }

  private addItemToPredictSet(
    ruleName: ProductionRule['name'],
    symbolId: SyntaxSymbol['id'],
  ): void {
    this.getPredictSet(ruleName).add(symbolId);
  }

  private calculatePredictTable(): void {
    this.predictRuleMap = {} as any;
    for (const rule of this.speficiation.productionRules) {
      const firstSet = this.first(rule.rhs);
      for (const sblId of firstSet) {
        this.addItemToPredictSet(rule.name, sblId);
      }

      if (this.epsilon(rule.rhs)) {
        const followOfLhs = this.getFollowSetById(rule.lhs.id);
        for (const sblId of followOfLhs) {
          this.addItemToPredictSet(rule.name, sblId);
        }
      }
    }
  }

  public getExpandingRule(
    expandingSymbol: SyntaxSymbol,
    inputToken: Token,
  ): ProductionRule {
    const rules = this.getRulesByLhsId(expandingSymbol.id);
    for (const rule of rules) {
      const predictSet = this.predictRuleMap[rule.name];
      if (predictSet.has(inputToken.tokenClassName)) {
        return rule;
      }
    }

    const logger = new Logger(PredictTableHelper.name);
    logger.error(
      `No rule found:\nexpandingSymbol: ${expandingSymbol.id}\ninputToken: ${inputToken.tokenClassName}`,
    );
    process.exit(1);
  }
}

@Injectable()
export class PredictTableHelperFactory {
  public makePredictTableHelper(
    speficiation: ILanguageSpecification,
  ): PredictTableHelper {
    return new PredictTableHelper(speficiation);
  }
}
