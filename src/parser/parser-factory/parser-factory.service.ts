import { Injectable } from '@nestjs/common';
import { PredictTableHelperFactory } from '../first';
import { ILanguageSpecification } from '../interfaces';
import { LL1PredictiveParser } from '../parser';

@Injectable()
export class ParserFactoryService {
  constructor(private predictTableHelperFactory: PredictTableHelperFactory) {}

  public makeParser(speficiation: ILanguageSpecification): LL1PredictiveParser {
    return new LL1PredictiveParser(
      speficiation,
      this.predictTableHelperFactory.makePredictTableHelper(speficiation),
    );
  }
}
