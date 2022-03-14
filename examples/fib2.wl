fib[1] = 1;
fib[2] = 1;
fib[n_] := fib[n-1] + fib[n-2];
validate[n_] := EqualQ[fib[n] + fib[n+1], fib[n+2]];
Map[Seq[8], fib];
Map[Seq[8], validate];
