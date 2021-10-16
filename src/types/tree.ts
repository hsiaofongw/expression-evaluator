import {
  IRuleSelectorMap,
  SyntaxRule,
  SyntaxTerm,
  SyntaxTermGroup,
} from './syntax';
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

  public findRewriteOption(
    selectorMap: IRuleSelectorMap,
  ): ISyntaxTreeNodeRewriteOption | undefined {
    for (let windowStart = 0; windowStart < this.length; windowStart++) {
      for (
        let windowSize = 1;
        windowSize <= this.length - (windowStart + 1);
        windowSize++
      ) {
        const windowSizeKey = windowSize.toString();
        if (!selectorMap[windowSizeKey]) {
          continue;
        }

        const subMapper = selectorMap[windowSizeKey];
        const termsInWindow = this.treeNodes
          .slice(windowStart, windowStart + windowSize)
          .map((node) => node.term);
        const termGroup = SyntaxTermGroup.createFromTerms(termsInWindow);
        const termGroupKey = termGroup.toString();

        if (!subMapper[termGroupKey]) {
          continue;
        }

        const ruleSelector = subMapper[termGroupKey];
        const rule = ruleSelector.rule;
        const subIndex = ruleSelector.subIndex;
        const rewriteOption: ISyntaxTreeNodeRewriteOption = {
          startIndex: windowStart,
          sliceLength: windowSize,
          genRule: rule,
          subRuleIndex: subIndex,
        };

        return rewriteOption;
      }
    }

    return undefined;
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
}
