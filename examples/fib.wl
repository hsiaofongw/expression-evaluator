fib[x_] := If[x == 1, 1, If[x == 2, 1, fib[x-1] + fib[x-2]]]
fib[6]
fib[7]
fib[8]
