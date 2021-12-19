import { Injectable } from '@nestjs/common';
import { Lexer } from './lexer/lexer.service';
import { IMainService } from './types/token';
import { RootEvaluatorBuilder } from './evaluator/root.evaluator';
import { stdin, stdout } from 'process';
import { createReadStream } from 'fs';
import { TokenizerStream } from './streams/fa';
import {
  Characterize,
  CharacterTyping,
  defaultCharTypeHierarchy,
  BreadthFirstTreeIterator,
  DepthFirstTreeIterator,
} from './streams/characterize';
import { resolve } from 'path';

@Injectable()
export class AppService implements IMainService {
  constructor(
    private lexicalAnalyzer: Lexer,
    private rootEvaluatorBuilder: RootEvaluatorBuilder,
  ) {}

  main(): void {
    // const treeI = new DepthFirstTreeIterator({
    //   root: defaultCharTypeHierarchy,
    //   hasChildren: (_node) => _node.children !== undefined,
    //   getChildren: (_node) =>
    //     _node.children === undefined ? [] : _node.children,
    // });

    // for (const node of treeI) {
    //   console.log(node);
    // }

    // return;

    const packageJsonFilePath = resolve('package.json');
    const readStream = createReadStream(packageJsonFilePath, {
      encoding: 'utf-8',
    });
    const characterize = new Characterize();
    const typing = new CharacterTyping(defaultCharTypeHierarchy);
    const chars = readStream.pipe(characterize).pipe(typing);
    chars.on('data', (data) => console.log(data));
    chars.on('close', () => console.log('close'));
    chars.on('end', () => console.log('end'));
  }
}
