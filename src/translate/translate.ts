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
  BlankNullSequenceExpr,
  BlankSequenceExpr,
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
  PatternExpr,
  PlusExpr,
  PowerExpr,
  RemainderExpr,
  ReplaceAllExpr,
  RuleDelayedExpr,
  RuleExpr,
  TimesExpr,
} from './config';
import { Expr, NonTerminalExpr } from './interfaces';

type Evaluator = (node: NonTerminalNode) => void;
type EvaluatorMap = Record<string, Evaluator>;

const doNothing = (_: any) => {};

export class ExpressionTranslate extends Transform {
  private exprStack: Expr[] = [];

  private evaluatorMap: EvaluatorMap = {
    's -> b5': (n) => this.evaluateEveryChild(n),

    'b6 -> b5 l': (n) => this.reduceByAppend(n, 0, 1),

    'l -> eps': doNothing,

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

    'rule -> -> b2l': (n) => {
      const lhs = this.popNode();
      this.evaluate(n.children[1]);
      const rhs = this.popNode();
      this.pushNode(AssignExpr([lhs, rhs]));
    },

    'rule -> :-> b2l': (n) => {
      const lhs = this.popNode();
      this.evaluate(n.children[1]);
      const rhs = this.popNode();
      this.pushNode(AssignDelayedExpr([lhs, rhs]));
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

    'ep -> - t ep': (n) => this.leftReduce(n, 1, 2, PlusExpr),

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

    'f0 -> compound': (n) => this.evaluateEveryChild(n),

    'f0 -> pattern_compound': (n) => this.evaluateEveryChild(n),

    'pattern_compound -> pattern_op pattern_ext': (n) =>
      this.evaluateEveryChild(n),

    'pattern_compound -> compound pattern_op pattern_ext': (n) => {
      this.evaluate(n.children[0]);
      const lhs = this.popNode();

      this.evaluate(n.children[1]);
      this.evaluate(n.children[2]);
      const blankLikeExpr = this.popNode();
      this.pushNode(PatternExpr([lhs, blankLikeExpr]));
    },

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
