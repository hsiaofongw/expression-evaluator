# 表达式求值器 Evaluator

这是一个命令行界面的表达式求值器，能进行一些简单的数学函数运算。但暂时还不支持自定义函数。

This is a expression evaluator, it provides commandline interface, it is capable of doing some simple calculations (listed below). Yet it currently doesn't support custom-defined functions.

这是基于 Nest 框架，以及作者自己写的 Lexer (词法分析器) 和 LL(1) Parser (语法分析器) 来实现的。

This project is based on [Nest.js Framework](https://nestjs.com/), and our own implementation of Lexer, LL(1) Parser, Translator and Evaluator.

## 致敬 Respects

作者非常喜欢 Wolfram 语言，于是现在是处于上手实现一个简化再简化版本的这么样的一个状态。

I enjoy using Wolfram Language so much, by now I am coding my own very simplified version of it.

以下是我的启发来源：

Below are what enlighten me:

- [Evaluation of Expressions - Wolfram Language & System Documentation Center](https://reference.wolfram.com/language/tutorial/EvaluationOfExpressions.html)（表达式的求值）

- [Everything Is an Expression - Wolfram Language & System Documentation Center](https://reference.wolfram.com/language/tutorial/Expressions.html) (一切皆表达式)

## 已实现函数列表 Currently Supported Functions

```
Plus[x, y]                     # x+y
Minus[x, y]                    # x-y
Times[x, y]                    # x*y
Divide[x, y]                   # x/y
If[x, y, z]                    # 如果 x 为真，返回 y, 否则返回 z
Take[x, y]                     # 访问 x 的第 y-1 个元素
GetHead[x]                     # 查看 x 表达式树的根节点，将根节点名称以标识符形式返回
GetParametersList[x]           # 获取 x 作为函数节点的参数列表，以列表形式返回
EqualQ[x, y]                   # 若 x 等于 y, 则返回 true, 否则返回 false, 判断方式见源码
GreaterThan[x, y]              # 返回数 x 是否严格大于 y
LessThan[x, y]                 # 返回数 x 是否严格小于 y
GreaterThanOrEqual[x, y]       # 返回 x 是否严格不小于 y
LessThanOrEqual[x, y]          # 返回 x 是否严格不大于 y
Sin[x]                         # 计算 x 的正弦值，将 x 视为弧度
Cos[x]                         # 计算 x 的余弦值，将 x 视为弧度
Tan[x]                         # 计算 x 的正切值，将 x 视为弧度
ArcSin[x]                      # 计算 Sin^{-1}[x], 在有定义的范围内
ArcCos[x]                      # 计算 Cos^{-1}[x], 在有定义的范围内
ArcTan[x]                      # 计算 Tan^{-1}[x], 在有定义的范围内
SinH[x]                        # 计算双曲正弦
CosH[x]                        # 计算双曲余弦
TanH[x]                        # 计算双曲正切
Exp[x]                         # 计算 e^{x}
Ln[x]                          # 计算 x 的自然对数
Lg[x]                          # 计算 x 的以 10 为底的对数
Log2[x]                        # 计算 x 的以 2 为底的对数
FullForm[x]                    # 给出输入的标准 Expression 形式
GetProductionRulesPreview[]    # 获得语法产生式规则集的预览（字符串形式、已格式化的）
Print[x]                       # 在控制台打印字符串 x, 字符串以双引号包围，支持 \ 转义
```

## 开发计划 Roadmap

按重要程度排序：

Most urgent at top:

- [ ] 可编程性 - 自定函数与递归调用
- [ ] 可编程性 - 高阶函数
- [ ] 可编程性 - 变量与常量
- [ ] 语言功能 - 错误提示与恢复
- [ ] 语言功能 - 异步求值与回调（将可能包括自实现的事件循环系统）
- [ ] 语言功能 - 模块系统
- [ ] 语言功能 - 翻译成 Native Binary Code
- [ ] 易用性 - VS Code LSP Server
- [ ] 易用性 - Web 端界面

## 语法概览 Grammar Overview

```
PRODUCTION RULES:
S -> A | E | str
A -> { L }
L -> ε
L -> S L'
L' -> , S L'
L' -> ε
E -> T E'
E' -> + T E' | - T E' | ε
T -> F T'
T' -> * F T' | / F T' | ε
F -> id P | ( E ) | num
P -> ε | [ L ]
```

其中各符号含义：

```
S: 开始符号
A: 数组
E: 表达式
E: 表达式余项
L: 逗号分隔列表
L': 列表余项
T: 项
T': 余项
F: 因子
P: 函数参数部分
```
