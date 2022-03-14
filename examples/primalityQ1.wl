smallestDivisor[n_] := findDivisor[n, 2];
findDivisor[n_, testDivisor_] := If[
  GreaterThan[Square[testDivisor], n],
  n,
  If[
    divides[testDivisor, n],
    testDivisor,
    findDivisor[n, Plus[testDivisor, 1]]
  ]
];
divides[a_, b_] := EqualQ[Remainder[b, a], 0];
primeQ[n_] := And[n > 1, EqualQ[n, smallestDivisor[n]]];

Filter[Seq[100], primeQ];
