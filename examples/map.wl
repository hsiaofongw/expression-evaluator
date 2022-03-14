Map[{ a, b, c}, f];
Map[Seq[-3, 3, 1], Function[x_, x * x]];

Reduce[{a, b, c}, f, init];

join[ { x___ }, { y___ } ] := { x, y };

seqIter[lst_, count_, max_] := If[
  count > max,
  lst,
  seqIter[join[lst, { count }], count + 1, max]
];

seq[n_] := seqIter[{}, 1, n];

Map[seq[10], Function[y_, y*y]];

Reduce[Map[seq[10], Function[y_, y*y]], Function[a_,b_,a+b],0];

filter[lst_, pred_] := Reduce[
  lst,
  Function[last_, curr_, If[pred[curr], join[last, { curr }], last]],
  {}
];

filter[Seq[5], Function[x_, x > 3]];
