import { Injectable } from '@nestjs/common';
import { PredictTableHelperFactory } from '../first';
import { ProductionRule } from '../interfaces';
import { LL1PredictiveParser } from '../parser';

@Injectable()
export class ParserFactoryService {
  constructor(private predictTableHelperFactory: PredictTableHelperFactory) {}

  public makeParser(allRules: ProductionRule[]): LL1PredictiveParser {
    return new LL1PredictiveParser(
      this.predictTableHelperFactory.makePredictTableHelper(allRules),
    );
  }
}
