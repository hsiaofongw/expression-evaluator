import { ArrayHelper } from 'src/helpers/to-array';
import { TokenClass, TypedToken } from 'src/lexer/interfaces';
import { Transform, TransformCallback } from 'stream';
import { SyntaxSymbolHelper } from './helpers';
import {
  Node,
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
  private _rootNode!: Node; // root node of syntax tree
  private get _nodeStackTop(): Node {
    // top of node stack
    return this._nodeStack[this._nodeStack.length - 1];
  }

  private _syntaxAnalysisPartner!: SyntaxSymbolHelper;
  private _config!: SyntaxAnalysisConfiguration;

  constructor(config: SyntaxAnalysisConfiguration) {
    super({ objectMode: true });

    this._initialize(config);
  }

  private _initialize(config: SyntaxAnalysisConfiguration): void {
    this._nodeStack = [];
    const root: Node = {
      type: 'nonTerminal',
      symbol: config.specialSymbol.entrySymbol,
      children: [],
      ruleName: '',
    };
    this._rootNode = root;
    this._nodeStack.push(root);
    this._syntaxAnalysisPartner = config.syntaxAnalysisPartner;
    this._config = config;
  }

  private _reset(): void {
    this._initialize(this._config);
  }

  _transform(
    lookAhead: TerminalNode,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    while (
      this._nodeStack.length > 0 &&
      this._nodeStackTop.type === 'nonTerminal'
    ) {
      const currentNode = this._nodeStack.pop() as Node;

      const rules = this._syntaxAnalysisPartner.getRulesFromPAT(
        currentNode.symbol,
        lookAhead.symbol,
      );

      if (rules.length > 0) {
        const rule = rules[0];
        const ruleName = rule.name;
        const rhs = rule.rhs;
        const rhsNodes: Node[] = [];
        for (const symbol of rhs) {
          if (symbol.id !== this._syntaxAnalysisPartner.epsilonSymbol.id) {
            if (symbol.type === 'nonTerminal') {
              const node: Node = {
                type: 'nonTerminal',
                symbol: symbol,
                children: [],
                ruleName: '',
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
          parentNode.ruleName = ruleName;
          parentNode.children = rhsNodes;
        }
      }
    }

    if (
      this._nodeStack.length > 0 &&
      this._nodeStackTop.type === 'terminal' &&
      this._nodeStackTop.symbol.id === lookAhead.symbol.id
    ) {
      this._nodeStackTop.token = lookAhead.token;
      this._nodeStack.pop();

      callback();
      return;
    }

    if (
      this._nodeStack.length === 0 &&
      lookAhead.symbol.id === this._syntaxAnalysisPartner.endOfFileSymbol.id
    ) {
      // console.log('push');
      // console.log(this._rootNode);
      // console.log('lookAhead');
      // console.log(lookAhead);
      this.push(this._rootNode);
      this._reset();
    }

    callback();
  }
}
