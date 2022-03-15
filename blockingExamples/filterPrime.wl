
filterPrime[{ p_, xs___ }] := ListJoin[ { p }, filterPrime[Filter[ { xs }, Function[x_, Remainder[x , p] > 0]]]];