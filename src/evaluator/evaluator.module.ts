import { Module } from '@nestjs/common';
import { allTerms } from 'src/data/definitions';
import { ExpressionEvaluatorBuilder } from './expression.evaluator';
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
  ],
  exports: [RootEvaluatorBuilder],
})
export class EvaluatorModule {}
