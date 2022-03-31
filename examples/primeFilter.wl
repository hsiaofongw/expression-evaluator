primeFilter[lst_] := If[
  Length[lst] == 0,
  {},
  Let[
    first = First[lst],
    rest = Rest[lst],
    ListJoin[
      { first },
      primeFilter[
        Filter[
          rest, 
          Function[x_, x % first !== 0]
        ]
      ]
    ]
  ]
];

primes[n_] := If[n < 2, {}, primeFilter[Seq[2, n]]];
primes[100];
