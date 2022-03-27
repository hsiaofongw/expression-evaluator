/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Logger } from '@nestjs/common';
import { Node, NonTerminalNode, TerminalNode } from 'src/parser/interfaces';
import { Transform, TransformCallback } from 'stream';
import {
  allSymbolsMap,
  AndExpr,
  AssignDelayedExpr,
  AssignExpr,
  AssociationListExpr,
  BlankExpr,
  BlankNullSequenceExpr,
  BlankSequenceExpr,
  DivideExpr,
  DoubleFactorialExpr,
  EqualQExpr,
  FactorialExpr,
  FloatExpr,
  GreaterThanExpr,
  GreaterThanOrEqualExpr,
  LessThanExpr,
  LessThanOrEqualExpr,
  ListExpr,
  MakeNonTerminalExpr,
  MinusExpr,
  NegativeExpr,
  NodeFactory,
  NotExpr,
  OrExpr,
  PatternExpr,
  PlusExpr,
  PowerExpr,
  RemainderExpr,
  ReplaceAllExpr,
  RuleDelayedExpr,
  RuleExpr,
  ScientificNotationExpr,
  StringExpr,
  TakeExpr,
  TimesExpr,
  True,
} from './config';
import {
  Expr,
  NonTerminalExpr,
  TerminalExpr,
  TerminalNumberExpr,
} from './interfaces';

type Evaluator = (node: NonTerminalNode) => void;
type EvaluatorMap = Record<string, Evaluator>;

const doNothing = (_: any) => {};

export class ExpressionTranslate extends Transform {
  private logger = new Logger(ExpressionTranslate.name);

  private exprStack: Expr[] = [];

  private evaluatorMap: EvaluatorMap = {
    's -> b5': (n) => this.evaluateEveryChild(n),

    'l -> eps': doNothing,

    'l -> s list_ext': (n) => {
      const lastExpr = this.popNode() as NonTerminalExpr;
      this.evaluate(n.children[0]);
      const currentExpr = this.popNode();
      lastExpr.children.push(currentExpr);
      this.pushNode(lastExpr);
      this.evaluate(n.children[1]);
    },

    'list_ext -> , s list_ext': (n) => {
      this.evaluate(n.children[1]);
      const currentExpr = this.popNode();
      const listExpr = this.popNode();
      (listExpr as NonTerminalExpr).children.push(currentExpr);
      this.pushNode(listExpr);
      this.evaluate(n.children[2]);
    },

    'list_ext -> eps': doNothing,

    'b5 -> b4 assign': (n) => this.evaluateEveryChild(n),

    'assign -> := b4 assign': (n) =>
      this.rightReduce(n, [1, 2], AssignDelayedExpr),

    'assign -> = b4 assign': (n) => this.rightReduce(n, [1, 2], AssignExpr),

    'assign -> eps': doNothing,

    'b4 -> b3 sub': (n) => this.evaluateEveryChild(n),

    'sub -> /. b3 sub': (n) => this.rightReduce(n, [1, 2], ReplaceAllExpr),

    'sub -> eps': doNothing,

    'b3 -> b2l rule': (n) => this.evaluateEveryChild(n),

    'rule -> -> b2l': (n) => {
      const lhs = this.popNode();
      this.evaluate(n.children[1]);
      const rhs = this.popNode();
      this.pushNode(RuleExpr([lhs, rhs]));
    },

    'rule -> :-> b2l': (n) => {
      const lhs = this.popNode();
      this.evaluate(n.children[1]);
      const rhs = this.popNode();
      this.pushNode(RuleDelayedExpr([lhs, rhs]));
    },

    'rule -> eps': doNothing,

    'b2l -> b2_not logic': (n) => this.evaluateEveryChild(n),

    'logic -> || b2_not logic': (n) => this.leftReduce(n, 1, 2, OrExpr),

    'logic -> && b2_not logic': (n) => this.leftReduce(n, 1, 2, AndExpr),

    'logic -> eps': doNothing,

    'b2_not -> ! b2_not': (n) => {
      this.evaluate(n.children[1]);
      const expr = this.popNode();
      this.pushNode(NotExpr([expr]));
    },
    'b2_not -> b2': (n) => this.evaluateEveryChild(n),

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

    'bool -> eps': doNothing,

    'e -> t ep': (n) => this.evaluateEveryChild(n),

    'ep -> + t ep': (n) => this.leftReduce(n, 1, 2, PlusExpr),

    'ep -> - t ep': (n) => this.leftReduce(n, 1, 2, MinusExpr),

    'ep -> eps': doNothing,

    't -> f3 tp': (n) => this.evaluateEveryChild(n),

    'tp -> * f3 tp': (n) => this.leftReduce(n, 1, 2, TimesExpr),

    'tp -> / f3 tp': (n) => this.leftReduce(n, 1, 2, DivideExpr),

    'tp -> eps': doNothing,

    'f3 -> f2 rem': (n) => this.evaluateEveryChild(n),

    'rem -> % f2 rem': (n) => this.leftReduce(n, 1, 2, RemainderExpr),

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

    'f0 -> compound pattern_compound': (n) => this.evaluateEveryChild(n),

    'f0 -> pattern_op pattern_ext': (n) => this.evaluateEveryChild(n),

    'pattern_compound -> pattern_op pattern_ext': (n) => {
      const lhs = this.popNode();
      this.evaluate(n.children[0]);
      this.evaluate(n.children[1]);
      const blankLikeExpr = this.popNode();
      this.pushNode(PatternExpr([lhs, blankLikeExpr]));
    },

    'pattern_compound -> eps': doNothing,

    'pattern_ext -> eps': doNothing,

    'pattern_ext -> compound': (n) => {
      const blankLikeExpr = this.popNode();
      this.evaluate(n.children[0]);
      const headExpr = this.popNode();
      (blankLikeExpr as NonTerminalExpr).children = [headExpr];
      this.pushNode(blankLikeExpr);
    },

    'pattern_op -> _': (n) => {
      this.pushNode(BlankExpr([]));
    },
    'pattern_op -> __': (n) => {
      this.pushNode(BlankSequenceExpr([]));
    },
    'pattern_op -> ___': (n) => {
      this.pushNode(BlankNullSequenceExpr([]));
    },
    'compound -> base compound_ext': (n) => this.evaluateEveryChild(n),
    'compound_ext -> eps': (n) => doNothing,
    'compound_ext -> [ compound_ext_2': (n) => this.evaluate(n.children[1]),
    'compound_ext_2 -> l ] compound_ext': (n) => {
      const headExpr = this.popNode();
      this.pushNode(MakeNonTerminalExpr(headExpr, []));
      this.evaluate(n.children[0]);
      this.evaluate(n.children[2]);
    },
    'compound_ext_2 -> [ s ] ] compound_ext': (n) => {
      const headExpr = this.popNode();
      this.evaluate(n.children[1]);
      const accessorExpr = this.popNode();
      this.pushNode(TakeExpr([headExpr, accessorExpr]));
      this.evaluate(n.children[4]);
    },
    'base -> ( e )': (n) => this.evaluate(n.children[1]),
    'base -> Number': (n) => this.evaluate(n.children[0]),
    'base -> { L }': (n) => {
      this.pushNode(ListExpr([]));
      this.evaluate(n.children[1]);
    },
    'base -> <| L |>': (n) => {
      this.pushNode(AssociationListExpr([]));
      this.evaluate(n.children[1]);
    },
    'base -> str': (n) => {
      this.pushNode(
        StringExpr((n.children[0] as TerminalNode).token?.content ?? ''),
      );
    },
    'base -> id': (n) => {
      if (n.children[0].type === 'terminal') {
        const identifierContent = n.children[0].token?.content ?? '';
        this.pushNode(NodeFactory.makeSymbol(identifierContent));
      } else {
        console.error("n.children[0].type is not 'terminal'");
        process.exit(1);
      }
    },
    'Number -> num num_ext': (n) => {
      this.pushNode({
        nodeType: 'terminal',
        expressionType: 'number',
        head: allSymbolsMap.NumberSymbol,
        value: parseFloat(
          (n.children[0] as TerminalNode).token?.content ?? '0',
        ),
      });
      this.evaluate(n.children[1]);
    },
    'num_ext -> eps': doNothing,
    'num_ext -> ! double_factorial': (n) => {
      const numberExpr = this.popNode();
      this.pushNode(FactorialExpr([numberExpr]));
      this.evaluate(n.children[1]);
    },
    'num_ext -> . num dot_ext': (n) => {
      const integerPart = this.popNode();
      const numNode = n.children[1] as TerminalNode;
      const numString = numNode.token.content ?? '0';
      const mantissaExpr: TerminalExpr = {
        nodeType: 'terminal',
        expressionType: 'number',
        head: allSymbolsMap.NumberSymbol,
        value: parseFloat(numString),
      };
      this.pushNode(FloatExpr([integerPart, mantissaExpr]));
      this.evaluate(n.children[2]);
    },
    'dot_ext -> eps': doNothing,
    'dot_ext -> id scientific_ext': (n) => this.evaluate(n.children[1]),
    'scientific_ext -> + num': (n) => {
      const floatExpr = this.popNode();
      const numNode = n.children[1] as TerminalNode;
      const numString = numNode.token.content ?? '0';
      const num = parseFloat(numString);
      const numExpr: TerminalNumberExpr = {
        nodeType: 'terminal',
        expressionType: 'number',
        head: allSymbolsMap.NumberSymbol,
        value: num,
      };
      this.pushNode(
        ScientificNotationExpr([floatExpr, allSymbolsMap.PlusSymbol, numExpr]),
      );
    },
    'scientific_ext -> - num': (n) => {
      const floatExpr = this.popNode();
      const numNode = n.children[1] as TerminalNode;
      const numString = numNode.token.content ?? '0';
      const num = parseFloat(numString);
      const numExpr: TerminalNumberExpr = {
        nodeType: 'terminal',
        expressionType: 'number',
        head: allSymbolsMap.NumberSymbol,
        value: num,
      };
      this.pushNode(
        ScientificNotationExpr([floatExpr, allSymbolsMap.MinusSymbol, numExpr]),
      );
    },
    'double_factorial -> eps': doNothing,
    'double_factorial -> !': (n) => {
      const factorialExor = this.popNode() as NonTerminalExpr;
      const numberExpr = factorialExor.children[0] as TerminalExpr;
      this.pushNode(DoubleFactorialExpr([numberExpr]));
    },
  };

  constructor() {
    super({ objectMode: true });
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
        this.logger.error('No evaluator');
        this.logger.log(JSON.stringify(node));
        process.exit(1);
      }
    } else {
      this.logger.error('Try evaluate a terminal node');
      this.logger.log(JSON.stringify(node));
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
