import {
  SyntaxDefinition,
  SyntaxTermGroup as SyntaxTermGroup,
  SyntaxRule,
  SyntaxTerm,
} from '../types/syntax';

/** 表达式 */
const expressionTerm = SyntaxTerm.create({
  isTerminal: false,
  name: 'Expression',
});

/** 数值表达式 */
const numberExpressionTerm = SyntaxTerm.create({
  isTerminal: false,
  name: 'NumberExpression',
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
  numberExpressionTerm,
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
    SyntaxTermGroup.createFromTerms([terms.numberExpressionTerm]),
    SyntaxTermGroup.createFromTerms([
      terms.leftParenthesisTerm,
      terms.expressionTerm,
      terms.rightParenthesisTerm,
    ]),
    SyntaxTermGroup.createFromTerms([
      terms.expressionTerm,
      terms.minusTerm,
      terms.expressionTerm,
    ]),
    SyntaxTermGroup.createFromTerms([
      terms.expressionTerm,
      terms.plusTerm,
      terms.expressionTerm,
    ]),
    SyntaxTermGroup.createFromTerms([
      terms.leftParenthesisTerm,
      terms.expressionTerm,
      terms.rightParenthesisTerm,
      terms.timesTerm,
      terms.leftParenthesisTerm,
      terms.expressionTerm,
      terms.rightParenthesisTerm,
    ]),
    SyntaxTermGroup.createFromTerms([
      terms.leftParenthesisTerm,
      terms.expressionTerm,
      terms.rightParenthesisTerm,
      terms.divideByTerm,
      terms.leftParenthesisTerm,
      terms.expressionTerm,
      terms.rightParenthesisTerm,
    ]),
  ],
});

/** 数值表达式生成式 */
const numberExpressionRule = SyntaxRule.create({
  targetTerm: terms.numberExpressionTerm,
  fromTermGroups: [
    SyntaxTermGroup.createFromTerms([terms.numberTerm]),
    SyntaxTermGroup.createFromTerms([
      terms.leftParenthesisTerm,
      terms.numberExpressionTerm,
      terms.rightParenthesisTerm,
    ]),
    SyntaxTermGroup.createFromTerms([
      terms.numberExpressionTerm,
      terms.timesTerm,
      terms.numberExpressionTerm,
    ]),
    SyntaxTermGroup.createFromTerms([
      terms.numberExpressionTerm,
      terms.divideByTerm,
      terms.numberExpressionTerm,
    ]),
  ],
});

/** 运算符生成式 */
const operatorRule = SyntaxRule.create({
  targetTerm: terms.operatorTerm,
  fromTermGroups: [
    SyntaxTermGroup.createFromTerms([terms.plusTerm]),
    SyntaxTermGroup.createFromTerms([terms.minusTerm]),
    SyntaxTermGroup.createFromTerms([terms.timesTerm]),
    SyntaxTermGroup.createFromTerms([terms.divideByTerm]),
  ],
});

/** 数字生成式 */
const numberRule = SyntaxRule.create({
  targetTerm: terms.numberTerm,
  fromTermGroups: [
    SyntaxTermGroup.createFromTerms([terms.positiveNumberTerm]),
    SyntaxTermGroup.createFromTerms([terms.negativeNumberTerm]),
  ],
});

/** 负数生成式 */
const negativeNumberRule = SyntaxRule.create({
  targetTerm: terms.negativeNumberTerm,
  fromTermGroups: [
    SyntaxTermGroup.createFromTerms([
      terms.leftParenthesisTerm,
      terms.minusTerm,
      terms.positiveNumberTerm,
      terms.rightParenthesisTerm,
    ]),
  ],
});

/** 语法 */
const rules = [
  expressionRule,
  numberExpressionRule,
  operatorRule,
  numberRule,
  negativeNumberRule,
];

export const syntaxDefinition = SyntaxDefinition.createFromRules(rules);
