import { Module } from '@nestjs/common';
import { ParserFactoryService } from './parser-factory/parser-factory.service';

@Module({ providers: [ParserFactoryService], exports: [ParserFactoryService] })
export class ParserModule {}
