makeAdder[x_] := Function[y_, x + y];

makeAdder[10];

makeAdder[10][24];

addByAdder[num_, func_] := func[num];

addByAdder[12, makeAdder[7]];

plusOne[func_] := Function[x_, func[x] + 1];

plusOne[makeAdder[5]][0];
