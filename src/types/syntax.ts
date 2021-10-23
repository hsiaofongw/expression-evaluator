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

  public static createTerminal(name: string): SyntaxTerm {
    return new SyntaxTerm({ name, isTerminal: true });
  }

  public static createNonTerminal(name: string): SyntaxTerm {
    return new SyntaxTerm({ name, isTerminal: false });
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
export type ISyntaxRule = {
  targetTerm: SyntaxTerm;
  fromTermGroup: SyntaxTermGroup;
};

/** 一条生成式 */
export class SyntaxRule implements ISyntaxRule {
  public readonly targetTerm!: SyntaxTerm;
  public readonly fromTermGroup!: SyntaxTermGroup;

  constructor(data: ISyntaxRule) {
    this.targetTerm = data.targetTerm;
    this.fromTermGroup = data.fromTermGroup;
  }

  public static create(data: ISyntaxRule): SyntaxRule {
    return new SyntaxRule(data);
  }

  public toString(): string {
    let result = `${this.targetTerm.toString()} ::= `;

    result = result + this.fromTermGroup.toString();

    return result;
  }
}

/** 生成式组 */
export type ISyntaxRuleGroup = {
  targetTerm: SyntaxTerm;
  fromTermGroups: SyntaxTermGroup[];
};

export class SyntaxRuleGroup implements ISyntaxRuleGroup {
  public readonly targetTerm!: SyntaxTerm;
  public readonly fromTermGroups!: SyntaxTermGroup[];

  constructor(data: ISyntaxRuleGroup) {
    this.targetTerm = data.targetTerm;
    this.fromTermGroups = data.fromTermGroups;
  }

  public static create(data: ISyntaxRuleGroup): SyntaxRuleGroup {
    return new SyntaxRuleGroup(data);
  }

  public static createFromRules(rules: ISyntaxRule[]): SyntaxRuleGroup {
    return new SyntaxRuleGroup({
      targetTerm: rules[0].targetTerm,
      fromTermGroups: rules.map((rule) => rule.fromTermGroup),
    });
  }

  public toString(): string {
    const headerPart = this.targetTerm.toString();
    const connectorPart = ' ::= ';
    const indents = headerPart.length + connectorPart.length - 2;
    const spaces = ' '.repeat(indents) + '| ';
    const gap = '\n' + spaces;
    const bodyPart = this.fromTermGroups
      .map((group) => group.toString())
      .join(gap);

    return headerPart + connectorPart + bodyPart;
  }
}

/** 语法定义，由生成式列表创建 */
export class SyntaxDefinition {
  public readonly ruleGroups!: SyntaxRuleGroup[];

  constructor(ruleGroups: SyntaxRuleGroup[]) {
    this.ruleGroups = ruleGroups;
  }

  public static createFromRuleGroups(
    ruleGroups: SyntaxRuleGroup[],
  ): SyntaxDefinition {
    return new SyntaxDefinition(ruleGroups);
  }

  public toBackusNormalFormString(): string {
    return this.ruleGroups
      .map((ruleGroup) => ruleGroup.toString())
      .join('\n\n');
  }

  public toString(): string {
    return this.toBackusNormalFormString();
  }
}
