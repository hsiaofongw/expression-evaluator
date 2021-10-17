import { SyntaxTreeNode } from 'src/types/tree';
import { GlobalContext } from './context';

export type IContext = {
  fork(treeNode: SyntaxTreeNode): IContext;
  getTreeNode(): SyntaxTreeNode;
  push(instruction: string): void;
  dump(): string[];
};

export type IEvaluator = {
  evaluate(): IEvaluator[];
  getContext(): GlobalContext;
};
