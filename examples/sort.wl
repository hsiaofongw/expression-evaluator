sort[lst_] := If[
  Length[lst] == 0,
  {},
  Let[
    first = First[lst],
    rest=Rest[lst],
    ListJoin[
      sort[Filter[rest, Function[x_, x <= first]]],
      { first },
      sort[Filter[rest, Function[x_, x > first]]]
    ]
  ]
];

sort[{7,3,5,4,6,1}];
