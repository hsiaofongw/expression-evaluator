fib1[x_] := If[
  x == 1, 
  1, 
  If[
    x == 2, 
    1, 
    fib1[x-1] + fib1[x-2]
  ]
];
validate[n_] := EqualQ[fib1[n] + fib1[n+1], fib1[n+2]];
Map[Seq[8], fib1];
Map[Seq[8], validate];
