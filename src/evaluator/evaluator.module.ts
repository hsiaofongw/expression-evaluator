import { Module } from '@nestjs/common';
import { allTerms } from 'src/data/definitions';
import { ExpressionEvaluatorBuilder } from './expression.evaluator';
import { MinusEvaluatorBuilder } from './minus.evaluator';
import { NumberExpressionEvaluatorBuilder } from './number-expression.evaluator';
import { NumberEvaluatorBuilder } from './number.evaluator';
import { PlusEvaluatorBuilder } from './plus.evaluator';
import { RootEvaluatorBuilder } from './root.evaluator';

@Module({
  providers: [
    RootEvaluatorBuilder,
    {
      provide: allTerms.expressionTerm.toString(),
      useClass: ExpressionEvaluatorBuilder,
    },
    {
      provide: allTerms.numberTerm.toString(),
      useClass: NumberEvaluatorBuilder,
    },
    {
      provide: allTerms.plusTerm.toString(),
      useClass: PlusEvaluatorBuilder,
    },
    {
      provide: allTerms.minusTerm.toString(),
      useClass: MinusEvaluatorBuilder,
    },
    {
      provide: allTerms.numberExpressionTerm.toString(),
      useClass: NumberExpressionEvaluatorBuilder,
    },
  ],
  exports: [RootEvaluatorBuilder],
})
export class EvaluatorModule {}
