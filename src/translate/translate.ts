/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Node, NonTerminalNode } from 'src/parser/interfaces';
import { Transform, TransformCallback } from 'stream';
import {
  allSymbolsMap,
  AndExpr,
  AssignDelayedExpr,
  AssignExpr,
  BlankExpr,
  DivideExpr,
  EqualQExpr,
  GreaterThanExpr,
  GreaterThanOrEqualExpr,
  LessThanExpr,
  LessThanOrEqualExpr,
  MinusExpr,
  NegativeExpr,
  NodeFactory,
  NotExpr,
  OrExpr,
  PlusExpr,
  PowerExpr,
  RemainderExpr,
  ReplaceAllExpr,
  RuleDelayedExpr,
  RuleExpr,
  TimesExpr,
} from './config';
import { Expr } from './interfaces';

type Evaluator = (node: NonTerminalNode) => void;
type EvaluatorMap = Record<string, Evaluator>;

const doNothing = (_: any) => {};

export class ExpressionTranslate extends Transform {
  private exprStack: Expr[] = [];

  private evaluatorMap: EvaluatorMap = {
    's -> b5': (n) => this.evaluateEveryChild(n),

    'l -> eps': doNothing,

    'b6 -> b5 l': (n) => this.reduceByAppend(n, 0, 1),

    'l -> , b5 l': (n) => this.reduceByAppend(n, 1, 2),

    'b5 -> b4 assign': (n) => this.evaluateEveryChild(n),

    'assign -> := b4 assign': (n) =>
      this.rightReduce(n, [1, 2], AssignDelayedExpr),

    'assign -> == b4 assign': (n) => this.rightReduce(n, [1, 2], AssignExpr),

    'assign -> eps': doNothing,

    'b4 -> b3 sub': (n) => this.evaluateEveryChild(n),

    'sub -> /. b3 sub': (n) => this.rightReduce(n, [1, 2], ReplaceAllExpr),

    'sub -> eps': doNothing,

    'b3 -> b2l rule': (n) => this.evaluateEveryChild(n),

    'rule -> -> b2l': (n) => this.rightReduce(n, [1], RuleExpr),

    'rule -> :-> b2l': (n) => this.rightReduce(n, [1], RuleDelayedExpr),

    'rule -> eps': doNothing,

    'b2l -> b2_not logic': (n) => this.evaluateEveryChild(n),

    'logic -> || b2_not logic': (n) => this.rightReduce(n, [1, 2], OrExpr),

    'logic -> && b2_not logic': (n) => this.rightReduce(n, [1, 2], AndExpr),

    'logic -> eps': doNothing,

    'b2_not -> ! b2_not': (n) => {
      this.evaluate(n.children[1]);
      const expr = this.popNode();
      this.pushNode(NotExpr([expr]));
    },
    'b2_not -> b2': (n) => this.evaluateEveryChild(n.children[0]),

    'b2 -> e bool': (n) => this.evaluateEveryChild(n),

    'bool -> > e bool': (n) => this.rightReduce(n, [1, 2], GreaterThanExpr),

    'bool -> >= e bool': (n) =>
      this.rightReduce(n, [1, 2], GreaterThanOrEqualExpr),

    'bool -> < e bool': (n) => this.rightReduce(n, [1, 2], LessThanExpr),

    'bool -> <= e bool': (n) =>
      this.rightReduce(n, [1, 2], LessThanOrEqualExpr),

    'bool -> == e bool': (n) => this.rightReduce(n, [1, 2], EqualQExpr),

    'bool -> === e bool': (n) => this.rightReduce(n, [1, 2], EqualQExpr),

    'bool -> !== e bool': (n) =>
      this.rightReduce(n, [1, 2], (children) =>
        NotExpr([EqualQExpr(children)]),
      ),

    'bool -> != e bool': (n) =>
      this.rightReduce(n, [1, 2], (children) =>
        NotExpr([EqualQExpr(children)]),
      ),

    'e -> t ep': (n) => this.evaluateEveryChild(n),

    'ep -> + t ep': (n) => this.rightReduce(n, [1, 2], PlusExpr),

    'ep -> - t ep': (n) => this.rightReduce(n, [1, 2], MinusExpr),

    'ep -> eps': doNothing,

    't -> f3 tp': (n) => this.evaluateEveryChild(n),

    'tp -> * f3 tp': (n) => this.rightReduce(n, [1, 2], TimesExpr),

    'tp -> / f3 tp': (n) => this.rightReduce(n, [1, 2], DivideExpr),

    'tp -> eps': doNothing,

    'f3 -> f2 rem': (n) => this.evaluateEveryChild(n),

    'rem -> % f2 rem': (n) => this.rightReduce(n, [1, 2], RemainderExpr),

    'rem -> eps': doNothing,

    'f2 -> - f1': (n) => {
      this.evaluate(n.children[1]);
      const expr = this.popNode();
      this.pushNode(NegativeExpr([expr]));
    },

    'f2 -> f1': (n) => this.evaluateEveryChild(n),

    'f1 -> f0 pow': (n) => this.evaluateEveryChild(n),

    'pow -> eps': doNothing,

    'pow -> ^ f0 pow': (n) => this.leftReduce(n, 1, 2, PowerExpr),

    'f0 -> f ptn': (n) => this.evaluateEveryChild(n),

    "S -> S' CMP_0": (node) => this.evaluateEveryChild(node),

    "CMP_0 -> == S' CMP_0": (node) =>
      this.reduce(node, allSymbolsMap.EqualQSymbol, 1, 2),

    'CMP_0 -> ε': doNothing,

    "S' -> E CMP_2": (node) => this.evaluateEveryChild(node),

    'L -> ε': doNothing,

    "L -> S L'": (node) => this.reduceByAppend(node, 0, 1),

    "L' -> , S L'": (node) => this.reduceByAppend(node, 1, 2),

    "L' -> ε": doNothing,

    'CMP_2 -> > E CMP_2': (node) =>
      this.reduce(node, allSymbolsMap.GreaterThanSymbol, 1, 2),

    'CMP_2 -> < E CMP_2': (node) =>
      this.reduce(node, allSymbolsMap.LessThanSymbol, 1, 2),

    'CMP_2 -> >= E CMP_2': (node) =>
      this.reduce(node, allSymbolsMap.GreaterThanOrEqualSymbol, 1, 2),

    'CMP_2 -> <= E CMP_2': (node) =>
      this.reduce(node, allSymbolsMap.LessThanOrEqualSymbol, 1, 2),

    'CMP_2 -> ε': doNothing,

    "E -> T E'": (node) => this.evaluateEveryChild(node),

    "E' -> '+' T E'": (node) =>
      this.reduce(node, allSymbolsMap.PlusSymbol, 1, 2),

    "E' -> '-' T E'": (node) =>
      this.reduce(node, allSymbolsMap.MinusSymbol, 1, 2),

    "E' -> ε": doNothing,

    "T -> REM_0 T'": (node) => this.evaluateEveryChild(node),

    "T' -> '*' REM_0 T'": (node) =>
      this.reduce(node, allSymbolsMap.TimesSymbol, 1, 2),

    "T' -> '/' REM_0 T'": (node) =>
      this.reduce(node, allSymbolsMap.DivideSymbol, 1, 2),

    "T' -> ε": doNothing,

    'REM_0 -> NEG REM_1': (node) => this.evaluateEveryChild(node),

    'REM_1 -> % NEG REM_1': (node) =>
      this.reduce(node, allSymbolsMap.RemainderSymbol, 1, 2),
    'REM_1 -> ε': doNothing,

    'NEG -> - POW_0': (node) => {
      this.evaluate(node.children[1]);
      const theValue = this.popNode();
      const negativeNode: Expr = {
        head: allSymbolsMap.NegativeSymbol,
        nodeType: 'nonTerminal',
        children: [theValue],
      };
      this.pushNode(negativeNode);
    },

    'NEG -> POW_0': (node) => this.evaluateEveryChild(node),

    'POW_0 -> F POW_1': (node) => this.evaluateEveryChild(node),
    'POW_1 -> ^ F POW_1': (node) =>
      this.reduce(node, allSymbolsMap.PowerSymbol, 1, 2),
    'POW_1 -> ε': doNothing,

    "F -> F' P": (node) => this.evaluateEveryChild(node),

    "F' -> ( E )": (node) => this.evaluate(node.children[1]),

    "F' -> number": (node) => {
      const v1 = node.children[0];
      if (v1.type === 'terminal' && v1.token) {
        const value = parseFloat(v1.token?.content ?? '0');
        const numberNode: Expr = {
          head: allSymbolsMap.NumberSymbol,
          nodeType: 'terminal',
          expressionType: 'number',
          value: value,
        };
        this.pushNode(numberNode);
      }
    },

    "F' -> id PTN": (node) => {
      const v1 = node.children[0];
      if (v1.type === 'terminal' && v1.token) {
        const identifier = v1.token.content;
        const symbolNode: Expr = {
          head: allSymbolsMap.SymbolSymbol,
          nodeType: 'terminal',
          expressionType: 'symbol',
          value: identifier,
        };
        this.pushNode(symbolNode);
        this.evaluate(node.children[1]);
      }
    },

    'PTN -> ε': doNothing,
    'PTN -> _ PTN_0': (node) => {
      const patternNameExpr = this.popNode();
      const blankExpr = BlankExpr();
      const patternExpr: Expr = {
        head: allSymbolsMap.PatternSymbol,
        nodeType: 'nonTerminal',
        children: [patternNameExpr, blankExpr],
      };
      this.pushNode(patternExpr);
      this.evaluate(node.children[1]);
    },

    'PTN_0 -> ε': doNothing,
    'PTN_0 -> id': (node) => {
      const v1 = node.children[0];
      if (v1.type === 'terminal' && v1.token?.content) {
        const patternExpr = this.popNode();
        if (patternExpr.nodeType === 'nonTerminal') {
          const blankExpr = patternExpr.children[1];
          if (blankExpr.nodeType === 'nonTerminal') {
            blankExpr.children = [NodeFactory.makeSymbol(v1.token.content)];
          }
        }
        this.pushNode(patternExpr);
      }
    },
    'PTN_0 -> _ PTN_1': (node) => {
      const patternExpr = this.popNode();
      if (patternExpr.nodeType === 'nonTerminal') {
        patternExpr.children[1] = {
          nodeType: 'nonTerminal',
          head: allSymbolsMap.BlankSequenceSymbol,
          children: [],
        };
      }
      this.pushNode(patternExpr);
      this.evaluate(node.children[1]);
    },

    'PTN_1 -> ε': doNothing,
    'PTN_1 -> id': (node) => {
      const v1 = node.children[0];
      if (v1.type === 'terminal' && v1.token) {
        const patternExpr = this.popNode();
        if (patternExpr.nodeType === 'nonTerminal') {
          const blankSequenceExpr = patternExpr.children[1];
          if (blankSequenceExpr.nodeType === 'nonTerminal') {
            blankSequenceExpr.children = [
              NodeFactory.makeSymbol(v1.token.content),
            ];
          }
        }
        this.pushNode(patternExpr);
      }
    },
    'PTN_1 -> _ PTN_2': (node) => {
      const patternExpr = this.popNode();
      if (patternExpr.nodeType === 'nonTerminal') {
        patternExpr.children[1] = {
          nodeType: 'nonTerminal',
          head: allSymbolsMap.BlankNullSequenceSymbol,
          children: [],
        };
      }
      this.pushNode(patternExpr);
      this.evaluate(node.children[1]);
    },

    'PTN_2 -> ε': doNothing,
    'PTN_2 -> id': (node) => {
      const v1 = node.children[0];
      if (v1.type === 'terminal' && v1.token) {
        const patternExpr = this.popNode();
        if (patternExpr.nodeType === 'nonTerminal') {
          const blankNullSequenceExpr = patternExpr.children[1];
          if (blankNullSequenceExpr.nodeType === 'nonTerminal') {
            blankNullSequenceExpr.children = [
              NodeFactory.makeSymbol(v1.token.content),
            ];
          }
        }
        this.pushNode(patternExpr);
      }
    },

    "F' -> str": (node) => {
      const v1 = node.children[0];
      if (v1.type === 'terminal') {
        const stringContent = v1.token.content ?? '';
        const stringNode: Expr = {
          head: allSymbolsMap.StringSymbol,
          nodeType: 'terminal',
          expressionType: 'string',
          value: stringContent,
        };
        this.pushNode(stringNode);
      }
    },

    "F' -> { L }": (node) => {
      const list = node.children[1];
      const listNode: Expr = {
        head: allSymbolsMap.ListSymbol,
        nodeType: 'nonTerminal',
        children: [],
      };
      this.pushNode(listNode);
      this.evaluate(list);
    },

    'P -> [ L ] P': (node) => {
      const previousNode: Expr = this.popNode();
      const functionNode: Expr = {
        head: previousNode,
        nodeType: 'nonTerminal',
        children: [],
      };
      this.pushNode(functionNode);
      this.evaluate(node.children[1]);
      this.evaluate(node.children[3]);
    },

    'P -> = S': (node) => {
      const leftValueNode = this.popNode();
      const assignNode: Expr = {
        head: allSymbolsMap.AssignSymbol,
        nodeType: 'nonTerminal',
        children: [leftValueNode],
      };

      this.evaluate(node.children[1]);
      const rightValue = this.popNode();
      assignNode.children.push(rightValue);

      this.pushNode(assignNode);
    },

    'P -> := S': (node) => {
      const leftValueNode = this.popNode();
      const assignDelayedNode: Expr = {
        head: allSymbolsMap.AssignDelayedSymbol,
        nodeType: 'nonTerminal',
        children: [leftValueNode],
      };

      this.evaluate(node.children[1]);
      const rightValue = this.popNode();
      assignDelayedNode.children.push(rightValue);

      this.pushNode(assignDelayedNode);
    },

    'P -> ε': (_) => {},
  };

  constructor() {
    super({ objectMode: true });
  }

  private reduce(
    node: Node,
    head: Expr,
    currIdx: number,
    nextIdx: number,
  ): void {
    if (node.type === 'nonTerminal') {
      const prev = this.popNode();
      this.evaluate(node.children[currIdx]);
      const current = this.popNode();

      const reduced: Expr = {
        nodeType: 'nonTerminal',
        head: head,
        children: [prev, current],
      };

      this.pushNode(reduced);

      this.evaluate(node.children[nextIdx]);
    }
  }

  private leftReduce(
    expr: NonTerminalNode,
    rhsOpIdx: number,
    restOpIdx: number,
    exprMaker: (children: Expr[]) => Expr,
  ): void {
    const lhs = this.popNode();
    this.evaluate(expr.children[rhsOpIdx]);
    const rhs = this.popNode();
    this.pushNode(exprMaker([lhs, rhs]));
    this.evaluate(expr.children[restOpIdx]);
  }

  private rightReduce(
    expr: NonTerminalNode,
    rightOperandsIndices: number[],
    exprMaker: (children: Expr[]) => Expr,
  ): void {
    const lhs = this.popNode();
    for (const idx of rightOperandsIndices) {
      this.evaluate(expr.children[idx]);
    }
    const rhs = this.popNode();
    this.pushNode(exprMaker([lhs, rhs]));
  }

  private reduceByAppend(
    node: NonTerminalNode,
    currIdx: number,
    nextIdx: number,
  ): void {
    const prev = this.popNode();
    if (prev.nodeType === 'nonTerminal') {
      this.evaluate(node.children[currIdx]);
      const current = this.popNode();
      const appended: Expr = {
        nodeType: 'nonTerminal',
        head: prev.head,
        children: [...prev.children, current],
      };
      this.pushNode(appended);
      this.evaluate(node.children[nextIdx]);
    }
  }

  private evaluateEveryChild(node: Node): void {
    if (node.type === 'nonTerminal') {
      node.children.forEach((child) => this.evaluate(child));
    }
  }

  private pushNode(node: Expr): void {
    this.exprStack.push(node);
  }

  private popNode(): Expr {
    return this.exprStack.pop() as Expr;
  }

  private evaluate(node: Node): void {
    if (node.type === 'nonTerminal') {
      const evaluator = this.evaluatorMap[node.ruleName];
      if (typeof evaluator === 'function') {
        evaluator(node);
      } else {
        console.error(`No evaluator`);
        console.error({ node });
        process.exit(1);
      }
    } else {
      console.error(`Try evaluate a terminal node`);
      console.error({ node });
      process.exit(1);
    }
  }

  public _transform(
    node: Node,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    if (node.type === 'nonTerminal') {
      this.evaluate(node);
      this.push(this.exprStack.pop());
    }
    callback();
  }
}
