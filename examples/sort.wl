Let[
  sort[lst_] := If[
    Length[lst] == 0,
    {},
    Let[
      first = First[lst],
      rest = Rest[lst],
      lhs = Filter[rest, Function[x_, x <= first]],
      rhs = Filter[rest, Function[x_, x > first]],
      sortedLhs = sort[lhs],
      sortedRhs = sort[rhs],
      middle = { first },
      result = ListJoin[sortedLhs, middle, sortedRhs],
      result
    ]
  ],
  sort[RandomInteger[{1, 1000}, 40]]
];
