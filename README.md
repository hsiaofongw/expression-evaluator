# 表达式求值器 Evaluator

这是一个命令行界面的表达式求值器，能进行一些简单的数学函数运算。支持自定义函数（包括递归函数），支持 If 分支执行。

This is a expression evaluator, it provides commandline interface, it is capable of doing some simple calculations (listed below). Yet it currently doesn't support custom-defined functions.

这是基于 Nest 框架，以及作者自己写的 Lexer (词法分析器) 和 LL(1) Parser (语法分析器) 来实现的。

This project is based on [Nest.js Framework](https://nestjs.com/), and our own implementation of Lexer, LL(1) Parser, Translator and Evaluator.

## 安装运行 Setup and Run

分为 3 个步骤：

1. 克隆仓库至运行环境，并切换到 master 分支：

```
git clone https://github.com/hsiaofongw/expression-evaluator.git
cd expression-evaluator
```

2. 安装依赖：

```
npm i  # 如 npm 提示找不到，则需要先安装 NodeJS 和 NPM 软件
```

3. 启动运行：

```
npm run start:dev  # 或者 npm run start:inspect
```

4. 试一试

在出现 `In[0]:` 字样的提示之后，可开始输入表达式，之后按回车键获得计算结果。

输入：

```
fib[x_] := If[x == 1, 1, If[x == 2, 1, fib[x-1] + fib[x-2]]]
```

按回车，这时定义了一个函数，系统能够输出斐波那契数列的第 x 项。

再输入：

```
fib[8]
```

并按回车，则系统能够输出斐波那契数列的第 8 项，即 21.

另外一个例程：

```
facIter[prod_, count_, max_] := If[count == max, count * prod, facIter[prod * count, count + 1, max]]
facIter[1, 1, 5]

```

该程序递归地定义了一个阶乘计算函数，输出结果是 5! 即 120.

按两次 Ctrl+c 退出程序。

## 致敬 Respects

作者非常喜欢 Wolfram 语言，于是现在是处于上手实现一个简化再简化版本的这么样的一个状态。

I enjoy using Wolfram Language so much, by now I am coding my own very simplified version of it.

以下是我的启发来源：

Here are what I found interesting:

- [Evaluation of Expressions - Wolfram Language & System Documentation Center](https://reference.wolfram.com/language/tutorial/EvaluationOfExpressions.html)（表达式的求值）

- [Everything Is an Expression - Wolfram Language & System Documentation Center](https://reference.wolfram.com/language/tutorial/Expressions.html) (一切皆表达式)

- [Backtracking in Regular Expressions](https://docs.microsoft.com/en-us/dotnet/standard/base-types/backtracking-in-regular-expressions)（讲正则表达式匹配的，关键点就是「回溯」。）

## 已实现函数列表 Currently Supported Functions

当前的版本仍非常不稳定，很多功能没有做，也很容易触发 bug, 但是因为这是一个从 0 到 1 的突破，所以发了 1.0 版本。

```
Plus[x, y]                         # x+y
Minus[x, y]                        # x-y
Times[x, y]                        # x*y
Divide[x, y]                       # x/y
If[x, y, z]                        # 如果 x 为真，返回 y, 否则返回 z
EqualQ[x, y]                       # 若 x 等于 y, 则返回 true, 否则返回 false, 判断方式见源码
Exp[x]                             # 计算 e^{x}
Ln[x]                              # 计算 x 的自然对数
Remainder[x, y]                    # 计算 x 除以 y 得到的余数
Power[x, y]                        # 计算 x^y
Negative[x]                        # 计算 0 - x
Assign[lhs, rhs]                   # 固定赋值，在全局上下文中对 rhs 求值一次，之后如果对 lhs 求值，得到的都是这次 rhs 求值结果
AssignDelayed[lhs, rhs]            # 延迟赋值，在之后对 lhs 求值时，结果为那时在全局上下文中对 rhs 求值的结果
If[cond, trueClause, falseClause]  # 条件求值，先对 cond 求值，若结果不为假，则返回对 trueClause 的求值结果，否则返回对 falseClause 的求值结果
```
