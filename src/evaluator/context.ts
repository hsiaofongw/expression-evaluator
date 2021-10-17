import { Injectable } from '@nestjs/common';
import { SyntaxTreeNode } from 'src/types/tree';
import { IContext } from './types';

export class GlobalContext implements IContext {
  private _treeNode: SyntaxTreeNode;
  private _instructionHistory!: string[];

  constructor(treeNode: SyntaxTreeNode, history?: string[]) {
    this.reset();
    this._treeNode = treeNode;
    if (history) {
      this._instructionHistory = history;
    }
  }

  public static createFromRootNode(treeNode: SyntaxTreeNode): GlobalContext {
    return new GlobalContext(treeNode);
  }

  fork(treeNode: SyntaxTreeNode): GlobalContext {
    return new GlobalContext(treeNode, this._instructionHistory);
  }

  getTreeNode(): SyntaxTreeNode {
    return this._treeNode;
  }

  push(instruction: string): void {
    console.log(instruction);
    this._instructionHistory.push(instruction);
  }

  reset(): void {
    this._instructionHistory = new Array<string>();
  }

  dump(): string[] {
    const dumpHistory = new Array<string>();
    for (const instruction of this._instructionHistory) {
      dumpHistory.push(instruction);
    }

    return dumpHistory;
  }
}
