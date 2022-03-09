fib[x_] := If[
  x == 1, 
  1, 
  If[
    x == 2, 
    1, 
    fib[x-1] + fib[x-2]
  ]
];
fib[6];
fib[7];
fib[8];
validate[n_] := EqualQ[fib[n] + fib[n+1], fib[n+2]];
validate[1];
validate[2];
validate[3];
validate[4];
validate[5];
