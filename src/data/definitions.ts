import {
  SyntaxDefinition,
  SyntaxTermGroup as SyntaxTermGroup,
  SyntaxRule,
  SyntaxTerm,
  SyntaxRuleGroup,
} from '../types/syntax';

/** 表达式 */
const expressionTerm = SyntaxTerm.createNonTerminal('Expression');

/** 数值表达式 */
const numberExpressionTerm = SyntaxTerm.createNonTerminal('NumberExpression');

/** 数字 */
const numberTerm = SyntaxTerm.createNonTerminal('Number');

/** 加减运算符 */
const plusMinusTerm = SyntaxTerm.createNonTerminal('PlusMinus');

/** 乘除运算符 */
const multiplyDivideTerm = SyntaxTerm.createNonTerminal('MultiplyDivide');

/** 左括号 */
const leftParenthesisTerm = SyntaxTerm.createTerminal('LeftParenthesis');

/** 右括号 */
const rightParenthesisTerm = SyntaxTerm.createTerminal('RightParenthesis');

/** 加号 */
const plusTerm = SyntaxTerm.createTerminal('Plus');

/** 减号 */
const minusTerm = SyntaxTerm.createTerminal('Minus');

/** 乘号 */
const timesTerm = SyntaxTerm.createTerminal('Times');

/** 除号 */
const divideByTerm = SyntaxTerm.createTerminal('DivideBy');

/** 正数 */
const positiveNumberTerm = SyntaxTerm.createTerminal('PositiveNumber');

/** 负数 */
const negativeNumberTerm = SyntaxTerm.createNonTerminal('NegativeNumber');

/** 所有 term */
export const terms = {
  expressionTerm,
  numberExpressionTerm,
  numberTerm,
  plusMinusTerm,
  multiplyDivideTerm,
  leftParenthesisTerm,
  rightParenthesisTerm,
  plusTerm,
  minusTerm,
  timesTerm,
  divideByTerm,
  positiveNumberTerm,
  negativeNumberTerm,
};

export const allTerms = terms;

/** 表达式生成式 */
const expressionRules = [
  SyntaxRule.create({
    targetTerm: terms.expressionTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([
      terms.numberExpressionTerm,
    ]),
  }),
  SyntaxRule.create({
    targetTerm: terms.expressionTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([
      terms.expressionTerm,
      terms.plusMinusTerm,
      terms.numberExpressionTerm,
    ]),
  }),
];

/** 表达式生成式组 */
const expressionRuleGroup = SyntaxRuleGroup.createFromRules(expressionRules);

/** 数值表达式生成式 */
const numberExpressionRules = [
  SyntaxRule.create({
    targetTerm: terms.numberExpressionTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([terms.numberTerm]),
  }),
  SyntaxRule.create({
    targetTerm: terms.numberExpressionTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([
      terms.numberExpressionTerm,
      terms.multiplyDivideTerm,
      terms.numberTerm,
    ]),
  }),
];

/** 数值表达式生成式组 */
const numberExpressionRuleGroup = SyntaxRuleGroup.createFromRules(
  numberExpressionRules,
);

/** 数字生成式 */
const numberRules = [
  SyntaxRule.create({
    targetTerm: terms.numberTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([
      terms.leftParenthesisTerm,
      terms.expressionTerm,
      terms.rightParenthesisTerm,
    ]),
  }),
  SyntaxRule.create({
    targetTerm: terms.numberTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([terms.positiveNumberTerm]),
  }),
  SyntaxRule.create({
    targetTerm: terms.numberTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([
      terms.leftParenthesisTerm,
      terms.minusTerm,
      terms.positiveNumberTerm,
      terms.rightParenthesisTerm,
    ]),
  }),
];

/** 数字生成式组 */
const numberRuleGroup = SyntaxRuleGroup.createFromRules(numberRules);

/** 加减操作符生成式 */
const plusMinusRules = [
  SyntaxRule.create({
    targetTerm: terms.plusMinusTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([terms.plusTerm]),
  }),
  SyntaxRule.create({
    targetTerm: terms.plusMinusTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([terms.minusTerm]),
  }),
];
const plusMinusRuleGroup = SyntaxRuleGroup.createFromRules(plusMinusRules);

/** 乘除操作符生成式 */
const multiplyDivideRules = [
  SyntaxRule.create({
    targetTerm: terms.multiplyDivideTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([terms.timesTerm]),
  }),
  SyntaxRule.create({
    targetTerm: terms.multiplyDivideTerm,
    fromTermGroup: SyntaxTermGroup.createFromTerms([terms.divideByTerm]),
  }),
];
const multiplyDivideRuleGroup =
  SyntaxRuleGroup.createFromRules(multiplyDivideRules);

export const syntaxDefinition = SyntaxDefinition.createFromRuleGroups([
  expressionRuleGroup,
  numberExpressionRuleGroup,
  numberRuleGroup,
  plusMinusRuleGroup,
  multiplyDivideRuleGroup,
]);
