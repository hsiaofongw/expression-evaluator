absOuter[x_] := If[x < 0, Negative[x], x];
absOuter[-10];
absOuter[10];
absOuter[0];
Map[Seq[-10,10,1],Function[x_,If[x<0,Negative[x],x]]];
Let[abs[x_]:=If[x<0,Negative[x],x],Map[Seq[-10,10,1],abs]];
Map[Filter[Seq[-10,10,1],Function[x_, x >= 0]],Function[x_,x*x]];
Let[f[x_]:=x*x,Map[Filter[Seq[-10,10,1],Function[x_, x>=0]], f]];