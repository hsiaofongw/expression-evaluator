import { Lexer } from 'src/lexer/lexer.service';
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

      term: SyntaxTerm.create({ isTerminal: true, name: tokenDesc.name }),
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

export type ISyntaxTreeNodeRewriteOptionCandidate = {
  option: ISyntaxTreeNodeRewriteOption;
  bonus: number;
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

  public static createFromStringAndLexer(s: string, lexer: Lexer) {
    const tokenGroup = lexer
      .tokenize(s)
      .tokenGroup.selectSubGroup((token) => token.name !== 'Space');

    return SyntaxTreeNodeGroup.createFromTokenGroup(tokenGroup);
  }
}
