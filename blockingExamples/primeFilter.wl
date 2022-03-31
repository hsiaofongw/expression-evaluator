primeFilter[lst_] := If[
  Length[lst] == 0,
  {},
  ListJoin[ 
    { First[lst] }, 
    primeFilter[
      Filter[
        Rest[lst], 
        Function[x_, x % First[lst] !== 0]
      ]
    ]
  ]
];

primeFilter[{ 2, 3, 4, 5, 6, 7, 8, 9 }];
