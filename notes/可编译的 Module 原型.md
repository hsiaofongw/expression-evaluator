# Compile 功能备忘录

## 1 Module

### 1. 1 Module 的输入和输出

1. Module 是最基本的可编译单元，类比于一个 .c 文件或者 .cpp 文件；
2. Module 的输入和输出都必须是原生数据类型或者原生类型的定长数组，例如：整型 i8, i16, i32, i64, 浮点型 f32, f64, f128, 字符型 char, 一个 i8 整型数组 i8[100] (长度 100), 数组不允许嵌套；
3. Module 的输入参数都必须有名字，Module 的参数数量必须是固定的，Module 允许有多个输出，Module 的输出的数量也必须是固定的，Module 的输入和输出的类型都必须确定。

### 1.2 Module 的结构

1. Module 包含全局变量列表。全局变量列表中的每一项可以是声明或者定义；
2. Module 中出现的每一个标识符都必须是有声明的；
3. 在求值器中用 Wolfram 语言编写 Module 时，Module 中允许出现未声明标识符，但是如果 Module 中有未声明的标识符，Module 的整个或者部分会被应用标准求值程序或者特殊求值程序，直到 Module 中的所有标识符都是良构的（即有声明的）；
4. 即便 Module 是良构的，用户也可以对 Module 进行求值，求值器按照全局规则对 Module 进行局部或者部分替换，直到替换过程收敛，求值器需要保证不会将良构 Module 替换未非良构 Module;
5. Module 声明的全局标识符可以是常量、变量或者函数，Module 可以声明多个函数，但是 Module 声明的函数的输入和输出都必须是原生类型，函数的输入可以有多个，输出也可以有多个。

### 1.3 Module 的使用

1. 用户在求值器中通过 Module[...] 表达式创建 Module, 例如

```Mathematica
In[1]:= myModule = Module[
  (* Module 可以从其它 Module 导入函数 *)
  Imports -> { 
    Import["pow", From -> module1],
    Import["b", From -> modulexxx]
  },

  (* Module 的声明列表 *)
  Declarations -> {
    PrimitiveFunction[
      Name -> "myFirstCompiledFunction",

      Inputs -> <| 
        "x" -> PrimitiveType["i32"], 
        "y" -> PrimitiveType["i32"] 
      |>,

      Outputs -> { 
        PrimitiveArrayType["i32", Size -> 3], 
        PrimitiveType["boolean"]
      },

      Expression -> (* An Expr that says How to Compute *)
    ],

    PrimitiveFunction[
      Name -> "anotherFunction",

      Inputs -> <| "x" -> PrimitiveType["i32"] |>,

      Outputs -> { PrimitiveType["i32"] },

      Expression -> (* An Expr that says How to Compute *)
    ],
  },

  (* Module 的导出列表，它指代的对象必须出现在 Declarations 或者 Imports 中 *)
  Exports -> { "myFirstCompiledFunction" }
];
```

2. 通过 Compile 得到一个 CompiledObject, 例如

```Mathematica
In[2]:= Compile[myModule];

Out[2]= CompiledModuleObject["6b0f21f9-f9f0-4ba1-8418-3bcf54268b93"];
```

我们可以这样使用这个 Module:

```Mathematica
In[3]:= myCompiledModule = Compile[myModule];

In[4]:= myCompiledModule["myFirstCompiledFunction"][1, 2];

Out[4]= { { blab, bla, blah }, True }
```

3. 我们也可以把编译后的 Module 保存为 Object 文件：

```Mathematica
In[5]:= SaveCompiledModule["hello.o", Format -> "Mach-O"];

Out[5]= ModuleSuccessfullySaved["hello.o"]
```

之后可以用 ld 工具来和其它 Object File 进行链接操作。

4. 我们可以加载一个 Module, 它应该是一个 Relocatable Object File, 或者是一个 Archive 文件，这样我们可以调里面的函数，但不保证所有的 Relocatable Object File 都能 Load 进来，不过至少要保证可以 Load 我们的程序产生的那些 Object File, 别的编译器产生的，就尽力而为吧。