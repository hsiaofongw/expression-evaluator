import { Module } from '@nestjs/common';
import { PredictTableHelperFactory } from './first';
import { ParserFactoryService } from './parser-factory/parser-factory.service';

@Module({
  providers: [ParserFactoryService, PredictTableHelperFactory],
  exports: [ParserFactoryService],
})
export class ParserModule {}
