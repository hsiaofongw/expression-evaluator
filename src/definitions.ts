import {
  SyntaxDefinition,
  SyntaxGroup,
  SyntaxRule,
  SyntaxTerm,
} from './syntax';

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
