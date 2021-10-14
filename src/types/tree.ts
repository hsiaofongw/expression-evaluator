import { SyntaxRule, SyntaxTerm } from './syntax';
import { IToken, TokenGroup } from './token';

export type IMark = {
  startIndex: number;
  length: number;
  content: string;
};

export type ISyntaxTreeNode = {
  mark?: IMark;
  term: SyntaxTerm;
  children?: ISyntaxTreeNode[];
};

export class SyntaxTreeNode implements ISyntaxTreeNode {
  mark?: IMark;
  term!: SyntaxTerm;
  children?: SyntaxTreeNode[];

  constructor(data: ISyntaxTreeNode) {
    if (data.mark) {
      this.mark = data.mark;
    }
    this.term = data.term;
    if (data.children) {
      this.children = data.children;
    }
  }

  public static createFromData(data: ISyntaxTreeNode) {
    return new SyntaxTreeNode(data);
  }

  public static createFromTokenDescriptor(tokenDesc: IToken) {
    return new SyntaxTreeNode({
      mark: {
        startIndex: tokenDesc.startIndex,
        length: tokenDesc.length,
        content: tokenDesc.content,
      },

      term: SyntaxTerm.create({ isTerminal: false, name: tokenDesc.name }),
    });
  }

  public static createFromNodes(nodes: SyntaxTreeNode[], newTerm: SyntaxTerm) {
    return new SyntaxTreeNode({
      term: newTerm,
      children: nodes.slice(0),
    });
  }
}

export type ISyntaxTreeNodeGroup = {
  treeNodes: SyntaxTreeNode[];
};

export type ISyntaxTreeNodeRewriteOption = {
  startIndex: number;
  sliceLength: number;
  genRule: SyntaxRule;
  subRuleIndex: number;
};

export class SyntaxTreeNodeGroup implements ISyntaxTreeNodeGroup {
  get length(): number {
    return this.treeNodes.length;
  }

  public readonly treeNodes!: SyntaxTreeNode[];

  constructor(data: ISyntaxTreeNodeGroup) {
    this.treeNodes = data.treeNodes;
  }

  public static createFromTreeNodes(treeNodes: SyntaxTreeNode[]) {
    return new SyntaxTreeNodeGroup({ treeNodes: treeNodes });
  }

  public static createFromTokenGroup(tokenGroup: TokenGroup) {
    return new SyntaxTreeNodeGroup({
      treeNodes: tokenGroup.tokens.map((token) =>
        SyntaxTreeNode.createFromTokenDescriptor(token),
      ),
    });
  }

  public rewriteThisInPlace(option: ISyntaxTreeNodeRewriteOption): void {
    const ruleGroup = option.genRule;
    const rule = ruleGroup.fromTermGroups[option.subRuleIndex];
    const sliceStart = option.startIndex;
    const sliceEnd = sliceStart + option.sliceLength;
    const nodesSlice = this.treeNodes.slice(sliceStart, sliceEnd);

    if (rule.terms.length !== nodesSlice.length) {
      throw new SyntaxError(
        "Can't rewrite since nodes slice length does not meets rule's specs..",
      );
    }

    const targetTerm = ruleGroup.targetTerm;
    const newSyntaxTreeNode = SyntaxTreeNode.createFromNodes(
      nodesSlice,
      targetTerm,
    );
    this.treeNodes.splice(sliceStart, option.sliceLength, newSyntaxTreeNode);
  }

  public isMatch(
    nodeOffset: number,
    termGroupOffset: number,
    rule: SyntaxRule,
  ): boolean {
    const termGroup = rule.fromTermGroups[termGroupOffset];
    const terms = termGroup.terms;
    const nodeSlice = this.treeNodes.slice(
      nodeOffset,
      nodeOffset + terms.length,
    );

    if (nodeSlice.length !== terms.length) {
      return false;
    }

    for (let i = 0; i < nodeSlice.length; i++) {
      const treeNode = nodeSlice[i];
      const term = terms[i];

      if (term.toString() !== treeNode.term.toString()) {
        return false;
      }
    }

    return true;
  }
}
