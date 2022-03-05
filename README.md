# 表达式求值器 Evaluator

这是一个命令行界面的表达式求值器，能进行一些简单的数学函数运算。但暂时还不支持自定义函数。

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

## 开发计划 Roadmap

按重要程度排序：

- [ ] 可编程性 - 自定函数与递归调用
- [ ] 可编程性 - 高阶函数
- [ ] 可编程性 - 变量与常量
- [ ] 语言功能 - 错误提示与恢复
- [ ] 语言功能 - 异步求值与回调（将可能包括自实现的事件循环系统）
- [ ] 语言功能 - 模块系统
- [ ] 语言功能 - 翻译成 Native Binary Code
- [ ] 易用性 - VS Code LSP Server
- [ ] 易用性 - Web 端界面

We are working on:

- [ ] Programmability - Custom Functions and Recursive Evaluating
- [ ] Programmability - Higher-order Function Support
- [ ] Programmability - Variables and Constants Support
- [ ] Language Feature - Error Diagnosis and Recovery
- [ ] Language Feature - Asynchronous
- [ ] Language Feature - Module System
- [ ] Language Feature - Being Able Compile to Native Code
- [ ] Accessibility - LSP Server
- [ ] Accessibility - Web User Interface

## 语法概览 Grammar Overview

```
PRODUCTION RULES:

S      ->  S'  CMP_0        # 开始语句，将可能直接推导为一个值或者一个 CMP_0 判断语句

CMP_0  ->  ==  S'  CMP_0    # 在 CMP_0 状态下，当遇到一个 == 符号时，将开始匹配相等性判断语句
        |  ε                # 如果没有符号可匹配，那就不匹配，翻译器对于 CMP_0 -> ε 会什么都不做

S'     ->  A                # 值可以是一个数组
        |  CMP_1            # 值可以是布尔代数运算或者常规算术运算的结果
        |  str              # 值可以是一个字符串

A      ->  {  L  }          # 符号 A 一定要推导为一个列表，而列表一定以左花括号 { 开头

L      ->  S  L'            # 一个列表可以是非空的
        |  ε                # 一个列表还可以是空的

L'     ->  ,  S  L'         # 一个列表如果是非空的，那么一定是逗号分隔的
        |  ε                # 一个列表如果是非空的，那么最后一项不会是逗号

CMP_1  ->  E  CMP_2         # 表达式可以参与到布尔代数运算中来，并且布尔算符与操作数的结合优先级是比普通四则运算算符低的，这也就是说：先做算术运算，后做更一般的代数运算

CMP_2  ->  >  E  CMP_2      # 这条规则将当前运算结果以严格大于布尔算符 > 作为算符与下一项进行运算
        |  <  E  CMP_2      # 这条规则将当前运算结果以严格小于布尔算符 < 作为算符与下一项进行运算
        |  >=  E  CMP_2     # 这条规则将当前运算结果以严格不小于布尔算符 >= 作为算符与下一项进行运算
        |  <=  E  CMP_2     # 这条规则将当前运算结果以严格不大于布尔算符 <= 作为算符与下一项进行运算
        |  ε                # 这条规则代表布尔表达式匹配结束

E      ->  T  E'            # 一个表达式由两部分构成，首项 T 和余项 E'

E'     ->  +  T  E'         # 余项 E' 可以以加号 + 开头，代表当前计算结果以相加的形式与下一项进行运算
        |  -  T  E'         # 余项 E' 可以以减号 - 开头，代表当前计算结果以相减的形式与下一项进行运算
        |  ε                # 如果没有符号可匹配，那就不匹配，翻译器对于 E' -> ε 会什么都不做

T      ->  REM_0  T'        # 一个项由两部分构成，首项、余项 T'

T'     ->  *  REM_0  T'     # 余项 T' 可以以乘号 * 开头，代表当前计算结果以相乘的形式与下一项进行运算
        |  /  REM_0  T'     # 余项 T' 可以以除号 / 开头，代表当前计算结果以相除的形式与下一项进行运算
        |  ε                # 如果没有符号可匹配，那就不匹配，翻译器对于 T' -> ε 会什么都不做

REM_0  ->  NEG  REM_1       # 余数运算开始

REM_1  ->  %  NEG REM_1     # 将当前结果与下一个数进行取余数运算
        |  ε                # 余数运算结束

NEG    ->  -  POW_0         # 一个数前面加负号可成为一个负数
        |  POW_0            # 一个数前面也可不加负号

POW_0  ->  F  POW_1         # 幂次运算开始

POW_1  ->  ^  F  POW_1      # 将当前结果与下一个数进行幂次运算
        |  ε                # 幂次运算结束

F      ->  (  E  )          # 一个因子 F 可以推导为一个被括号对包住的东西，这时向前看符号一定是左括号 (
        |  num              # 一个因子 F 可以推导为一个数字，显然这需要向前看符号为数字 token 也就是 num 才能匹配
        |  id  P            # 一个因子 F 可以推导为一个标识符 id, 显然这需要向前看符号为标识符 token 也就是 id 时才能匹配
         
P      ->  [  L  ]  P'      # 符号 P 可以被推导为一个被方括号包围的串，并且最左边一定是左方括号，这时，翻译器将会将栈中的标识符弹出，然后制造一个函数表达式节点，再将函数表达式节点弹回去
        |  =  S             # 符号 P 可以被推导为一个以单等于号开头的串，翻译器在翻译应用了这样的产生式的节点时，会将栈顶的值弹出，以弹出值作为左值节点，然后对 S 节点求值并将它作为右值节点弹出，最后再弹回一个 Assign 节点到栈完事
        |  ε                # 如果没有符号可匹配，那就不匹配，翻译器对于 P -> ε 会什么都不做
        
P'     ->  =  S             # 符号 P' 可以被推导为一个以单等于号开头的串，翻译器在翻译应用了这样的产生式的节点时，会将栈顶的值弹出，以弹出值作为左值节点，然后对 S 节点求值并将它作为右值节点弹出，最后再弹回一个 Assign 节点到栈完事
        |  ε                # 如果没有符号可匹配，那就不匹配，翻译器对于 P' -> ε 会什么都不做
```
