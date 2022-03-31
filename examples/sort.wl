sort[lst_] := If[
  Length[lst] == 0,
  {},
  Let[
    first = First[lst],
    rest = Rest[lst],
    lhs = sort[Filter[rest, Function[x_, x <= first]]],
    rhs = sort[Filter[rest, Function[x_, x > first]]],
    ListJoin[
      lhs,
      { first },
      rhs
    ]
  ]
];

sort[{3,2,1}];
