facIter[prod_, count_, max_] := If[
  count == max, 
  count * prod, 
  facIter[prod * count, count + 1, max]
];
facIter[1, 1, 3];
facIter[1, 1, 4];
facIter[1, 1, 5];
