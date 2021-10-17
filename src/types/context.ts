import { SyntaxDefinition } from './syntax';
import { SyntaxTreeNodeGroup } from './tree';

export type ISyntaxRewriteContext = {
  treeNodesGroup: SyntaxTreeNodeGroup;
  syntaxDefinition: SyntaxDefinition;
};

export class SyntaxRewriteContext implements ISyntaxRewriteContext {
  public readonly treeNodesGroup!: SyntaxTreeNodeGroup;
  public readonly syntaxDefinition!: SyntaxDefinition;

  constructor(data: ISyntaxRewriteContext) {
    this.treeNodesGroup = data.treeNodesGroup;
    this.syntaxDefinition = data.syntaxDefinition;
  }

  public static create(data: ISyntaxRewriteContext) {
    return new SyntaxRewriteContext(data);
  }
}
