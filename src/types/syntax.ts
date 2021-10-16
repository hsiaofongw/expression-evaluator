import * as util from 'util';

/** term */
export type ISyntaxTerm = {
  isTerminal: boolean;
  name: string;
  toString(): string;
};

/** 一个 term */
export class SyntaxTerm implements ISyntaxTerm {
  public readonly isTerminal!: boolean;
  public readonly name!: string;

  constructor(data: ISyntaxTerm) {
    this.isTerminal = data.isTerminal;
    this.name = data.name;
  }

  public static create(data: ISyntaxTerm): SyntaxTerm {
    return new SyntaxTerm(data);
  }

  public toString(): string {
    if (this.isTerminal) {
      return `"${this.name}"`;
    } else {
      return `<${this.name}>`;
    }
  }

  [util.inspect.custom]() {
    return this.toString();
  }
}

/** 一个 term 组 */
export class SyntaxTermGroup {
  public readonly terms: SyntaxTerm[];

  constructor(data: SyntaxTerm[]) {
    this.terms = data;
  }

  public static createFromTerms(data: SyntaxTerm[]) {
    return new SyntaxTermGroup(data);
  }

  public toString(): string {
    return this.terms.map((term) => term.toString()).join(' ');
  }
}

/** 生成式 */
export type ISyntaxGeneratingRule = {
  targetTerm: SyntaxTerm;
  fromTermGroups: SyntaxTermGroup[];
};

/** 一条生成式 */
export class SyntaxRule implements ISyntaxGeneratingRule {
  public readonly targetTerm!: SyntaxTerm;
  public readonly fromTermGroups!: SyntaxTermGroup[];

  constructor(data: ISyntaxGeneratingRule) {
    this.targetTerm = data.targetTerm;
    this.fromTermGroups = data.fromTermGroups;
  }

  public static create(data: ISyntaxGeneratingRule): SyntaxRule {
    return new SyntaxRule(data);
  }

  public toString(): string {
    let result = `${this.targetTerm.toString()} ::= `;

    const indent = result.length - 2;

    function spaceByIndent(indentLen: number): string {
      let result = '';
      for (let i = 0; i < indentLen; i++) {
        result = result + ' ';
      }
      return result;
    }

    result =
      result +
      this.fromTermGroups
        .map((termGroup) => termGroup.toString())
        .join('\n' + spaceByIndent(indent) + '| ');

    return result;
  }
}

/** 语法替换规则选择器及其索引 */
export type IRuleSelector = { rule: SyntaxRule; subIndex: number };
export type IRuleSelectorMap = Record<string, Record<string, IRuleSelector>>;

/** 语法定义，由生成式列表创建 */
export class SyntaxDefinition {
  public readonly rules!: SyntaxRule[];

  constructor(syntaxRules: SyntaxRule[]) {
    this.rules = syntaxRules;
  }

  public static createFromRules(syntaxRules: SyntaxRule[]): SyntaxDefinition {
    return new SyntaxDefinition(syntaxRules);
  }

  public toBCNRString(): string {
    return this.rules.map((rule) => rule.toString()).join('\n\n');
  }

  public toString(): string {
    return this.toBCNRString();
  }

  public makeIndex(): IRuleSelectorMap {
    const selectorMap: IRuleSelectorMap = {};

    for (const rule of this.rules) {
      for (
        let subIndex = 0;
        subIndex < rule.fromTermGroups.length;
        subIndex++
      ) {
        const termGroup = rule.fromTermGroups[subIndex];

        const groupLen = termGroup.terms.length;
        const groupLenKey = groupLen.toString();
        if (!selectorMap[groupLenKey]) {
          selectorMap[groupLenKey] = {};
        }

        const subSelectorMap = selectorMap[groupLenKey];
        const groupTermsKey = termGroup.toString();

        subSelectorMap[groupTermsKey] = { rule, subIndex };
      }
    }

    return selectorMap;
  }
}
