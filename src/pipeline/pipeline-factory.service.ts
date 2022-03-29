import { Inject, Injectable } from '@nestjs/common';
import { StringHelper } from 'src/helpers/string-helper';
import { NewLexerFactoryService } from 'src/new-lexer/services/new-lexer-factory/new-lexer-factory.service';
import { ILanguageSpecification } from 'src/parser/interfaces';
import { ParserFactoryService } from 'src/parser/parser-factory/parser-factory.service';
import { PreEvaluator, Evaluator } from 'src/translate/evaluate';
import { ExpressionTranslate } from 'src/translate/translate';
import { Writable, Readable } from 'stream';

@Injectable()
export class PipelineFactoryService {
  constructor(
    private lexerFactory: NewLexerFactoryService,
    @Inject('LanguageSpecification') private langSpecs: ILanguageSpecification,
    private parserFactory: ParserFactoryService,
  ) {}

  public makeEvaluatePipeline(): {
    input: Writable;
    output: Readable;
  } {
    const currentSeqNum = 0;
    const lexerFactory = this.lexerFactory;
    const parserFactory = this.parserFactory;
    const langSpecs = this.langSpecs;

    const stringSplit = StringHelper.makeCharSplitTransform(); // 一个把输入字符串转换成字符流的 Transform，其中每个字符仍然是用 string 表示
    const lexer = lexerFactory.makeLexer(); // 一次读入一个字符，每次输出时输出一个 token
    const mapToEol = lexerFactory.makeEOLMapTransform(); // 将分号映射为 EOL 字符
    const stringEscapeTransform = StringHelper.makeStringEscapeTransform(); // 处理字符串转义
    const dropBlank = StringHelper.makeStripTransform('blank');
    const dropComment = StringHelper.makeStripTransform('comment');
    const parser = parserFactory.makeParser(langSpecs); // 基于 token 流构建语法分析树
    const translator = new ExpressionTranslate();
    const preEvaluate = new PreEvaluator(); // Pre-Evaluate
    const evaluate = new Evaluator(currentSeqNum); // Evaluate Expr

    stringSplit // 输入 Buffer 拆成一个个字符
      .pipe(lexer) // 字符组合成 token
      .pipe(mapToEol) // 分号 token 映射为 eol token
      .pipe(stringEscapeTransform) // 字符串转义
      .pipe(dropBlank) // 去掉空白区域（对应 blank token）
      .pipe(dropComment) // 去掉注释（对应 comment token）
      .pipe(parser) // 读取 token 流中的 token, 构建语法分析树
      .pipe(translator) // 翻译
      .pipe(preEvaluate) // 预求值
      .pipe(evaluate); // 求值

    return { input: stringSplit, output: evaluate };
  }
}
