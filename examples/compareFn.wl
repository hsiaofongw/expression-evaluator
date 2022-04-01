mySort[lst_, compareFn_] := If[
  Length[lst] == 0, 
  {},
  Let[
    first = First[lst],
    rest = Rest[lst],
    lhs = Filter[rest, Function[x_, compareFn[x, first] <= 0]],
    rhs = Filter[rest, Function[x_, compareFn[x, first] > 0]],
    ListJoin[mySort[lhs, compareFn], { First[lst] }, mySort[rhs, compareFn]]
  ]
];

mySort[RandomInteger[{1,1000}, 40], Function[x_, y_, y - x]];
