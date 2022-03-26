import { Injectable } from '@nestjs/common';
import { LL1PredictiveParser } from '../parser';

@Injectable()
export class ParserFactoryService {
  public makeParser(): LL1PredictiveParser {
    return new LL1PredictiveParser();
  }
}
