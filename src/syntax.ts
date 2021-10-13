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

export type SyntaxGroup = SyntaxTerm[];
export type SyntaxRule = {
  targetTerm: SyntaxTerm;
  fromTermGroups: SyntaxGroup[];
};

/** 语法 */
export const syntax: SyntaxRule[] = [
  {
    targetTerm: terms.expressionTerm,
    fromTermGroups: [
      [terms.numberTerm],
      [terms.expressionTerm, terms.operatorTerm, terms.expressionTerm],
      [
        terms.leftParenthesisTerm,
        terms.expressionTerm,
        terms.rightParenthesisTerm,
      ],
    ],
  },
  {
    targetTerm: terms.operatorTerm,
    fromTermGroups: [
      [terms.plusTerm],
      [terms.minusTerm],
      [terms.timesTerm],
      [terms.divideByTerm],
    ],
  },
  {
    targetTerm: terms.numberTerm,
    fromTermGroups: [[terms.positiveNumberTerm], [terms.negativeNumberTerm]],
  },
  {
    targetTerm: terms.negativeNumberTerm,
    fromTermGroups: [
      [
        terms.leftParenthesisTerm,
        terms.minusTerm,
        terms.positiveNumberTerm,
        terms.rightParenthesisTerm,
      ],
    ],
  },
];
