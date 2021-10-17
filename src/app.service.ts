import { Injectable } from '@nestjs/common';
import { Lexer } from './lexer/lexer.service';
import { IMainService } from './types/token';
import { syntaxDefinition } from './data/definitions';
import { SyntaxTreeNodeGroup } from './types/tree';
import { stdin } from 'process';
import { SyntaxRewriteContext } from './types/context';
import { RootEvaluatorBuilder } from './evaluator/root.evaluator';

@Injectable()
export class AppService implements IMainService {
  constructor(
    private lexicalAnalyzer: Lexer,
    private rootEvaluatorBuilder: RootEvaluatorBuilder,
  ) {}

  main(): void {
    console.log(syntaxDefinition.toBackusNormalFormString());

    console.log({ parse: (x) => this.parse(x) });

    stdin.on('data', (data) => {
      const expression = data.toString('utf8');
      this.parse(expression);
    });
  }

  parse(expression: string) {
    // const testString = '1 + (-10) - 1 * 2 * 3 / 4 - 5';
    // const testString = '(-10) - 1 * 2 * 3 / 4 - 5';
    // console.log(expression);

    const treeNodesGroup = SyntaxTreeNodeGroup.createFromStringAndLexer(
      expression,
      this.lexicalAnalyzer,
    );

    const context = SyntaxRewriteContext.create({
      syntaxDefinition,
      treeNodesGroup,
    });

    // console.log({
    //   syntaxDefinition,
    //   treeNodesGroup,
    //   ruleSelectorMap,
    //   context,

    // const rootEvaluator = this.rootEvaluatorBuilder.build(
    //   GlobalContext.createFromRootNode(treeNodesGroup.treeNodes[0]),
    // );

    // const evaluators: IEvaluator[] = [rootEvaluator];
    // while (evaluators.length) {
    //   const evaluator = evaluators.pop();
    //   if (evaluator) {
    //     const derivedEvaluators = evaluator.evaluate();
    //     derivedEvaluators.reverse();
    //     derivedEvaluators.forEach((_derivedEvaluator) =>
    //       evaluators.push(_derivedEvaluator),
    //     );
    //   }
    // }
  }
}
