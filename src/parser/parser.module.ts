import { Module } from '@nestjs/common';
import { languageSpecification } from './config';
import { PredictTableHelperFactory } from './predict-table-helper-factory/predict-table-helper-factory.service';
import { ParserFactoryService } from './parser-factory/parser-factory.service';

@Module({
  providers: [
    ParserFactoryService,
    PredictTableHelperFactory,
    { provide: 'LanguageSpecification', useValue: languageSpecification },
  ],
  exports: [ParserFactoryService, 'LanguageSpecification'],
})
export class ParserModule {}
