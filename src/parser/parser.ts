import { Token } from 'src/new-lexer/interfaces';
import { Transform, TransformCallback } from 'stream';
import { allRules, sbl } from './config';
import { PredictHelper } from './first';
import { Node } from './interfaces';

export class LL1PredictiveParser extends Transform {
  private parseStack!: Node[];
  private rootNode!: Node; // root node of syntax tree

  private get stackTop(): Node {
    return this.parseStack[this.parseStack.length - 1];
  }

  constructor() {
    super({ objectMode: true });
    this.init();
  }

  /** 初始化或者重置都是调用这个函数 */
  private init(): void {
    this.rootNode = {
      type: 'nonTerminal',
      symbol: sbl.start,
      children: [],
      ruleName: '', // 在解析的过程中，展开它的时候再写上
    };
    this.parseStack = [this.rootNode];
  }

  _transform(
    inputBufferHead: Token,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    if (this.parseStack.length === 0) {
      this.push(this.rootNode);
      this.init();
      callback();
    } else {
      // 如果能展开则先尝试展开，展开后再匹配，展开不了就报错
      // stacktop 的非终结符号节点展开之后可能仍是非终结符号节点，所以要用 while 循环重复几遍
      while (this.stackTop.type === 'nonTerminal') {
        const lhs = this.stackTop.symbol;
        const rules = allRules.filter((rule) => rule.lhs.id === lhs.id);
        const expandSbl = this.stackTop;
        this.parseStack.pop();

        // 寻找规则展开 expandSbl, 并且把规则右边的符号转换成语法树节点倒序入栈
        let expanded = false;
        for (const rule of rules) {
          // 对每个 rule: expandSbl -> x, 计算 rule 的 predictSet
          const predictSet = PredictHelper.predictSet(rule, allRules);

          // 若当前输入 token 处在 predictSet 中，则选择这个 rule 展开 expandSbl
          if (predictSet.has(inputBufferHead.tokenClassName)) {
            expanded = true;
            // 记下这条 rule 的名字
            expandSbl.ruleName = rule.name;
            const rhs = rule.rhs;

            // 对这条 rule 的 RHS 中的每个符号 rhsSbl（倒序）
            for (let i = 0; i < rhs.length; i++) {
              const rhsSbl = rhs[rhs.length - 1 - i];

              if (rhsSbl.type === 'terminal') {
                // 若 rhsSbl 是一个 terminal 类型的语法符号
                const node: Node = {
                  type: 'terminal',
                  symbol: rhsSbl,
                };

                // 则在被展开的这个节点的 children 中入栈一个 terminal 类型的 Node
                expandSbl.children.push(node);

                // 并且在当前 parse Stack 入栈一个 terminal 类型的 Node, 这两个是同一个
                this.parseStack.push(node);
              } else {
                // 以此类推
                // 只不过，对于 RHS 中的 nonTerminal 符号，要把它转为 NonTerminal 树节点
                const node: Node = {
                  type: 'nonTerminal',
                  children: [],
                  symbol: rhsSbl,
                  ruleName: '',
                };
                expandSbl.children.push(node);
                this.parseStack.push(node);
              }
            }

            // 展开完成之后 break 这个寻找 rule 的过程
            break;
          }
        }

        // 如果展开不了当前语法符号则需要报语法错误，让开发者去调试
        if (expanded === false) {
          console.error('在语法解析时遇到错误：找不到规则来展开当前符号');
          process.exit(1);
        }
      }

      if (this.parseStack.length) {
        if (this.stackTop.type === 'terminal') {
          this.stackTop.token = inputBufferHead;
          this.parseStack.pop();
        }
      } else {
        this.push(this.rootNode);
      }

      callback();
    }
  }
}
