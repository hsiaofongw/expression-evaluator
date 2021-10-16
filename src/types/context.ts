import { IRuleSelectorMap } from './syntax';
import { ISyntaxTreeNodeRewriteOption, SyntaxTreeNodeGroup } from './tree';

export type ISyntaxRewriteContext = {
  treeNodesGroup: SyntaxTreeNodeGroup;
};

export class SyntaxRewriteContext implements ISyntaxRewriteContext {
  public readonly treeNodesGroup!: SyntaxTreeNodeGroup;

  constructor(treeNodesGroup: SyntaxTreeNodeGroup) {
    this.treeNodesGroup = treeNodesGroup;
  }

  public static createFromTokenNodes(treeNodesGroup: SyntaxTreeNodeGroup) {
    return new SyntaxRewriteContext(treeNodesGroup);
  }

  public step(
    ruleSelectorMap: IRuleSelectorMap,
  ): ISyntaxTreeNodeRewriteOption | undefined {
    const rewriteOption =
      this.treeNodesGroup.findRewriteOption(ruleSelectorMap);

    if (rewriteOption) {
      this.treeNodesGroup.rewriteThisInPlace(rewriteOption);
      return rewriteOption;
    }

    return undefined;
  }

  public stepUntilConverge(
    ruleSelectorMap: IRuleSelectorMap,
  ): ISyntaxTreeNodeRewriteOption[] {
    const options: ISyntaxTreeNodeRewriteOption[] =
      new Array<ISyntaxTreeNodeRewriteOption>();

    let option = this.step(ruleSelectorMap);
    while (option !== undefined) {
      options.push(option);
      option = this.step(ruleSelectorMap);
    }

    return options;
  }
}
