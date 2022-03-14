fib2[1] = 1;
fib2[2] = 1;
fib2[n_] := fib2[n-1] + fib2[n-2];
validate[n_] := EqualQ[fib2[n] + fib2[n+1], fib2[n+2]];
Map[Seq[8], fib2];
Map[Seq[8], validate];
