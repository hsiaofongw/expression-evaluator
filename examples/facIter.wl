facIter[prod_, count_, max_] := If[
  count == max, 
  count * prod, 
  facIter[prod * count, count + 1, max]
];
factorial[n_] := facIter[1, 1, n];
Map[Seq[6], factorial];
