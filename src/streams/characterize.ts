import { Transform } from 'stream';

export interface ICharType {
  name: string;
  test(s: string): boolean;
}

export interface ICharBasicObject {
  content: string;
  offset: number;
}

export interface ICharObject extends ICharBasicObject {
  charType?: ICharType;
}

export class Digit implements ICharType {
  name = 'digit';

  test(s: string): boolean {
    const regex = new RegExp(/\d+/);
    return regex.test(s);
  }
}

export class GenericChar implements ICharType {
  name = 'char';

  test(_: string): boolean {
    return true;
  }
}

export class GenericOperator implements ICharType {
  name = 'genericOperator';

  test(s: string): boolean {
    const regex = new RegExp(/(\+|\-|\*|\/)/);
    return regex.test(s);
  }
}

export class PlusOperator implements ICharType {
  name = 'plusOperator';

  test(s: string): boolean {
    const regex = new RegExp(/\+/);
    return regex.test(s);
  }
}

export class MinusOperator implements ICharType {
  name = 'minusOperator';

  test(s: string): boolean {
    const regex = new RegExp(/\-/);
    return regex.test(s);
  }
}

export class TimesOperator implements ICharType {
  name = 'timesOperator';

  test(s: string): boolean {
    const regex = new RegExp(/\*/);
    return regex.test(s);
  }
}

export class DivideByOperator implements ICharType {
  name = 'divideByOperator';

  test(s: string): boolean {
    const regex = new RegExp(/\//);
    return regex.test(s);
  }
}

export class Dot implements ICharType {
  name = 'dot';

  test(s: string): boolean {
    const regex = new RegExp(/\./);
    return regex.test(s);
  }
}

export class LeftParenthesis implements ICharType {
  name = 'leftParenthesis';

  test(s: string): boolean {
    const regex = new RegExp(/\(/);
    return regex.test(s);
  }
}

export class RightParenthesis implements ICharType {
  name = 'rightParenthesis';

  test(s: string): boolean {
    const regex = new RegExp(/\)/);
    return regex.test(s);
  }
}

export class Space implements ICharType {
  name = 'space';

  test(s: string): boolean {
    const regex = new RegExp(/\s+/);
    return regex.test(s);
  }
}

export class Letter implements ICharType {
  name = 'letter';

  test(s: string): boolean {
    const regex = new RegExp(/[a-zA-Z_]/);
    return regex.test(s);
  }
}

export interface ICharTypeHierarchy {
  charType: ICharType;
  children?: ICharTypeHierarchy[];
}

export const defaultCharTypeHierarchy: ICharTypeHierarchy = {
  charType: new GenericChar(),
  children: [
    { charType: new Letter() },
    { charType: new Space() },
    { charType: new Digit() },
    {
      charType: new GenericOperator(),
      children: [
        { charType: new PlusOperator() },
        { charType: new MinusOperator() },
        { charType: new TimesOperator() },
        { charType: new DivideByOperator() },
      ],
    },
    { charType: new Dot() },
    { charType: new LeftParenthesis() },
    { charType: new RightParenthesis() },
  ],
};

export type TreeDescription<T> = {
  root: T;
  hasChildren(_node: T): boolean;
  getChildren(_node: T): T[];
};

export type IterValue<T> = {
  value?: { node: T; index: number };
  done: boolean;
};

export class BreadthFirstTreeIterator<T> {
  root!: T;
  hasChildren!: (_node: T) => boolean;
  getChildren!: (_node: T) => T[];
  currentIndex!: number;
  nodesQueue!: T[];

  constructor(treeDescription: TreeDescription<T>) {
    this.root = treeDescription.root;
    this.hasChildren = treeDescription.hasChildren;
    this.getChildren = treeDescription.getChildren;
    this.currentIndex = 0;
    this.nodesQueue = new Array<T>();
    this.nodesQueue.push(this.root);
  }

  [Symbol.iterator]() {
    return { next: () => this.next() };
  }

  next(): IterValue<T> {
    if (this.nodesQueue.length === 0) {
      return { done: true };
    }

    const currentNode = this.nodesQueue.shift();
    if (this.hasChildren(currentNode)) {
      const childrenNode = this.getChildren(currentNode);
      for (const childNode of childrenNode) {
        this.nodesQueue.push(childNode);
      }
    }

    const iteratorValue = {
      value: { node: currentNode, index: this.currentIndex },
      done: false,
    };

    this.currentIndex = this.currentIndex + 1;

    return iteratorValue;
  }
}

export class DepthFirstTreeIterator<T> {
  root!: T;
  hasChildren!: (_node: T) => boolean;
  getChildren!: (_node: T) => T[];
  currentIndex!: number;
  nodesQueue!: T[];

  constructor(treeDescription: TreeDescription<T>) {
    this.root = treeDescription.root;
    this.hasChildren = treeDescription.hasChildren;
    this.getChildren = treeDescription.getChildren;
    this.currentIndex = 0;
    this.nodesQueue = new Array<T>();
    this.nodesQueue.push(this.root);
  }

  [Symbol.iterator]() {
    return { next: () => this.next() };
  }

  next(): IterValue<T> {
    if (this.nodesQueue.length === 0) {
      return { done: true };
    }

    const currentNode = this.nodesQueue.pop();
    if (this.hasChildren(currentNode)) {
      const childrenNode = this.getChildren(currentNode).slice().reverse();
      for (const childNode of childrenNode) {
        this.nodesQueue.push(childNode);
      }
    }

    const iteratorValue = {
      value: { node: currentNode, index: this.currentIndex },
      done: false,
    };

    this.currentIndex = this.currentIndex + 1;

    return iteratorValue;
  }
}

/** 把字符串流转变成基础字符对象流 */
export class Characterize extends Transform {
  constructor() {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
      objectMode: true,
    });
  }

  _transform(
    chunk: string,
    encoding: string,
    callback: (error?: any) => void,
  ): void {
    const chars: ICharBasicObject[] = new Array<ICharBasicObject>();
    let offset = 0;
    for (const char of chunk) {
      chars.push({ content: char, offset });
      offset += 1;
    }

    for (const char of chars) {
      this.push(char);
    }
    callback();

    // this.push(chunk);
  }
}

/** 把基础字符对象流转变成带有字符类型标记的字符对象流 */
export class CharacterTyping extends Transform {
  hierarchy!: ICharTypeHierarchy;

  constructor(hierarchy: ICharTypeHierarchy) {
    super({ objectMode: true });
    this.hierarchy = hierarchy;
  }

  _transform(
    chunk: ICharBasicObject,
    encoding: string,
    callback: (error?: any) => void,
  ): void {
    const content = chunk.content;
    const charObj: ICharObject = { ...chunk };

    const hierarchyIter = new BreadthFirstTreeIterator({
      root: this.hierarchy,
      hasChildren: (_node) => _node.children !== undefined,
      getChildren: (_node) =>
        _node.children === undefined ? [] : _node.children,
    });

    for (const stage of hierarchyIter) {
      // console.log({ stage });
      const charType = stage.node.charType;
      if (charType.test(content)) {
        charObj.charType = charType;
      }
    }

    this.push(charObj);
    callback();
  }
}
