import { Test, TestingModule } from '@nestjs/testing';
import { NewLexerFactoryService } from './new-lexer-factory.service';

describe('NewLexerFactoryService', () => {
  let service: NewLexerFactoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewLexerFactoryService],
    }).compile();

    service = module.get<NewLexerFactoryService>(NewLexerFactoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
