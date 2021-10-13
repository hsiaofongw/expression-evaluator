import * as util from 'util';

export type ISyntaxTerm = {
  isTerminal: boolean;
  name: string;
  toString(): string;
};

export class SyntaxTerm implements ISyntaxTerm {
  isTerminal!: boolean;
  name!: string;

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

export type ISyntaxGroup = SyntaxTerm[];

export class SyntaxGroup {
  terms: SyntaxTerm[];

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

export type ISyntaxRule = {
  targetTerm: SyntaxTerm;
  fromTermGroups: SyntaxGroup[];
};

export class SyntaxRule implements ISyntaxRule {
  targetTerm!: SyntaxTerm;
  fromTermGroups!: SyntaxGroup[];

  constructor(data: ISyntaxRule) {
    this.targetTerm = data.targetTerm;
    this.fromTermGroups = data.fromTermGroups;
  }

  public static create(data: ISyntaxRule): SyntaxRule {
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

export class SyntaxDefinition {
  rules!: SyntaxRule[];

  constructor(syntaxRules: SyntaxRule[]) {
    this.rules = syntaxRules;
  }

  public static create(syntaxRules: SyntaxRule[]): SyntaxDefinition {
    return new SyntaxDefinition(syntaxRules);
  }

  public toBCNRString(): string {
    return this.rules.map((rule) => rule.toString()).join('\n\n');
  }

  public toString(): string {
    return this.toBCNRString();
  }
}

/** 表达式 */
const expressionTerm = SyntaxTerm.create({
  isTerminal: false,
  name: 'Expression',
});

/** 数字 */
const numberTerm = SyntaxTerm.create({ isTerminal: false, name: 'Number' });

/** 运算符 */
const operatorTerm = SyntaxTerm.create({ isTerminal: false, name: 'Operator' });

/** 左括号 */
const leftParenthesisTerm = SyntaxTerm.create({
  isTerminal: true,
  name: 'LeftParenthesis',
});

/** 右括号 */
const rightParenthesisTerm = SyntaxTerm.create({
  isTerminal: true,
  name: 'RightParenthesis',
});

/** 加号 */
const plusTerm = SyntaxTerm.create({ isTerminal: true, name: 'Plus' });

/** 减号 */
const minusTerm = SyntaxTerm.create({ isTerminal: true, name: 'Minus' });

/** 乘号 */
const timesTerm = SyntaxTerm.create({ isTerminal: true, name: 'Times' });

/** 除号 */
const divideByTerm = SyntaxTerm.create({ isTerminal: true, name: 'DivideBy' });

/** 正数 */
const positiveNumberTerm = SyntaxTerm.create({
  isTerminal: true,
  name: 'PositiveNumber',
});

/** 负数 */
const negativeNumberTerm = SyntaxTerm.create({
  isTerminal: false,
  name: 'NegativeNumber',
});

/** 所有 term */
export const terms = {
  expressionTerm,
  numberTerm,
  operatorTerm,
  leftParenthesisTerm,
  rightParenthesisTerm,
  plusTerm,
  minusTerm,
  timesTerm,
  divideByTerm,
  positiveNumberTerm,
  negativeNumberTerm,
};

/** 表达式生成式 */
const expressionRule = SyntaxRule.create({
  targetTerm: terms.expressionTerm,
  fromTermGroups: [
    SyntaxGroup.create([terms.numberTerm]),
    SyntaxGroup.create([
      terms.expressionTerm,
      terms.operatorTerm,
      terms.expressionTerm,
    ]),
    SyntaxGroup.create([
      terms.leftParenthesisTerm,
      terms.expressionTerm,
      terms.rightParenthesisTerm,
    ]),
  ],
});

/** 运算符生成式 */
const operatorRule = SyntaxRule.create({
  targetTerm: terms.operatorTerm,
  fromTermGroups: [
    SyntaxGroup.create([terms.plusTerm]),
    SyntaxGroup.create([terms.minusTerm]),
    SyntaxGroup.create([terms.timesTerm]),
    SyntaxGroup.create([terms.divideByTerm]),
  ],
});

/** 数字生成式 */
const numberRule = SyntaxRule.create({
  targetTerm: terms.numberTerm,
  fromTermGroups: [
    SyntaxGroup.create([terms.positiveNumberTerm]),
    SyntaxGroup.create([terms.negativeNumberTerm]),
  ],
});

/** 负数生成式 */
const negativeNumberRule = SyntaxRule.create({
  targetTerm: terms.negativeNumberTerm,
  fromTermGroups: [
    SyntaxGroup.create([
      terms.leftParenthesisTerm,
      terms.minusTerm,
      terms.positiveNumberTerm,
      terms.rightParenthesisTerm,
    ]),
  ],
});

/** 语法 */
const rules = [expressionRule, operatorRule, numberRule, negativeNumberRule];

export const syntaxDefinition = SyntaxDefinition.create(rules);
