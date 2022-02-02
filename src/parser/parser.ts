import { ArrayHelper } from 'src/helpers/to-array';
import { TokenClass, TypedToken } from 'src/lexer/interfaces';
import { Transform, TransformCallback } from 'stream';
import { SyntaxSymbolHelper } from './helpers';
import {
  Node,
  ProductionRule,
  SyntaxAnalysisConfiguration,
  SyntaxSymbol,
  TerminalNode,
} from './interfaces';

export class ToTerminalNode extends Transform {
  private _tokenClassNameToSyntaxSymbol: Record<
    TokenClass['name'],
    SyntaxSymbol
  > = {};

  constructor(config: SyntaxAnalysisConfiguration) {
    super({ objectMode: true });

    this._tokenClassNameToSyntaxSymbol = {};
    const symbolMap = this._tokenClassNameToSyntaxSymbol;
    const symbols = Array.isArray(config.symbols)
      ? config.symbols
      : ArrayHelper.toArray(config.symbols);
    for (const symbol of symbols) {
      if (symbol.type === 'terminal') {
        symbolMap[symbol.definition.tokenClassName] = symbol;
      }
    }
  }

  _transform(
    token: TypedToken,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    const tokenClass = token.type;
    const tokenClassName = tokenClass.name;
    const terminalSymbol = this._tokenClassNameToSyntaxSymbol[tokenClassName];
    const node: TerminalNode = {
      type: 'terminal',
      token: token,
      symbol: terminalSymbol,
    };
    this.push(node);
    callback();
  }
}

export class LL1PredictiveParser extends Transform {
  private _nodeStack!: Node[];
  private _lookAhead!: TerminalNode; // assigned in _transform
  private _rootNode!: Node; // root node of syntax tree
  private get _nodeStackTop(): Node {
    // top of node stack
    return this._nodeStack[this._nodeStack.length - 1];
  }

  private _syntaxAnalysisPartner!: SyntaxSymbolHelper;

  constructor(config: SyntaxAnalysisConfiguration) {
    super({ objectMode: true });

    this._nodeStack = [];
    const root: Node = {
      type: 'nonTerminal',
      symbol: config.specialSymbol.entrySymbol,
      children: [],
    };
    this._rootNode = root;
    this._nodeStack.push(root);
    this._syntaxAnalysisPartner = config.syntaxAnalysisPartner;
  }

  _transform(
    chunk: TerminalNode,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this._lookAhead = chunk;

    while (
      this._nodeStack.length > 0 &&
      this._nodeStackTop.type === 'nonTerminal'
    ) {
      const currentNode = this._nodeStack.pop() as Node;

      const rules = this._syntaxAnalysisPartner.getRulesFromPAT(
        currentNode.symbol,
        this._lookAhead.symbol,
      );

      if (rules.length > 0) {
        const rule = rules[0];
        const rhs = rule.rhs;
        const rhsNodes: Node[] = [];
        for (const symbol of rhs) {
          if (symbol.id !== this._syntaxAnalysisPartner.epsilonSymbol.id) {
            if (symbol.type === 'nonTerminal') {
              const node: Node = {
                type: 'nonTerminal',
                symbol: symbol,
                children: [],
              };
              rhsNodes.push(node);
            } else {
              const node: Node = {
                type: 'terminal',
                symbol: symbol,
              };
              rhsNodes.push(node);
            }
          }
        }

        const parentNode = currentNode;
        for (let i = 0; i < rhsNodes.length; i++) {
          const node = rhsNodes[rhsNodes.length - i - 1];
          this._nodeStack.push(node);
        }

        if (parentNode.type === 'nonTerminal') {
          parentNode.children = rhsNodes;
        }
      }
    }

    if (
      this._nodeStack.length > 0 &&
      this._nodeStackTop.type === 'terminal' &&
      this._nodeStackTop.symbol.id === this._lookAhead.symbol.id
    ) {
      this._nodeStackTop.token = this._lookAhead.token;
      this._nodeStack.pop();
      callback();
      return;
    }

    callback();
  }

  _flush(callback: TransformCallback): void {
    const root = this._rootNode;
    const nodes: Node[] = [root];
    while (nodes.length > 0) {
      const node = nodes.pop() as Node;
      if (node.type === 'nonTerminal') {
        node.children = node.children.filter((nodeChild) => {
          if (
            nodeChild.type === 'nonTerminal' &&
            nodeChild.symbol.expandSymbol === true &&
            nodeChild.children.length === 0
          ) {
            return false;
          }

          return true;
        });

        for (let i = 0; i < node.children.length; i++) {
          nodes.push(node.children[node.children.length - 1 - i]);
        }
      }
    }

    this.push(root);

    callback();
  }
}
