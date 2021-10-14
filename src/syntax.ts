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

/** term 组 */
export type ISyntaxGroup = SyntaxTerm[];

/** 一个 term 组 */
export class SyntaxGroup {
  public readonly terms: SyntaxTerm[];

  constructor(data: SyntaxTerm[]) {
    this.terms = data;
  }

  public static create(data: SyntaxTerm[]) {
    return new SyntaxGroup(data);
  }

  public toString(): string {
    return this.terms.map((term) => term.toString()).join(' ');
  }
}

/** 生成式 */
export type ISyntaxGeneratingRule = {
  targetTerm: SyntaxTerm;
  fromTermGroups: SyntaxGroup[];
};

/** 一条生成式 */
export class SyntaxGeneratingRuleGroup implements ISyntaxGeneratingRule {
  public readonly targetTerm!: SyntaxTerm;
  public readonly fromTermGroups!: SyntaxGroup[];

  constructor(data: ISyntaxGeneratingRule) {
    this.targetTerm = data.targetTerm;
    this.fromTermGroups = data.fromTermGroups;
  }

  public static create(data: ISyntaxGeneratingRule): SyntaxGeneratingRuleGroup {
    return new SyntaxGeneratingRuleGroup(data);
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

/** 语法定义，由生成式列表创建 */
export class SyntaxDefinition {
  public readonly rules!: SyntaxGeneratingRuleGroup[];

  constructor(syntaxRules: SyntaxGeneratingRuleGroup[]) {
    this.rules = syntaxRules;
  }

  public static create(
    syntaxRules: SyntaxGeneratingRuleGroup[],
  ): SyntaxDefinition {
    return new SyntaxDefinition(syntaxRules);
  }

  public toBCNRString(): string {
    return this.rules.map((rule) => rule.toString()).join('\n\n');
  }

  public toString(): string {
    return this.toBCNRString();
  }
}
