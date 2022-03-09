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
primeQ[n_] := EqualQ[n, smallestDivisor[n]];
primeQ[2];
primeQ[3];
primeQ[4];
primeQ[5];
primeQ[9];
primeQ[7];
