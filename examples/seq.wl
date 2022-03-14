Seq[10];
Seq[1, 5];
Seq[1, 5, 2];
Reduce[Seq[10], Function[x_, y_, x + y * y], 0];
