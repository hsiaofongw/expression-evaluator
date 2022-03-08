countChange[amount_] := coinChange[amount, 5];

coinChange[amount_, kindsOfCoins_] := If[
  amount == 0, 
  1,
  If[
    or[amount < 0, kindsOfCoins == 0], 
    0,
    Plus[
      coinChange[amount, Minus[kindsOfCoins - 1]],
      coinChange[Minus[amount, firstDenomination[kindsOfCoins]], kindsOfCoins]
    ]
  ]
];

or[cond1_, cond2_] := If[cond1, True, If[cond2, True, False]];

firstDenomination[kindsOfCoins_] := If[
  kindsOfCoins == 1, 
  1, 
  If[
    kindsOfCoins == 2, 
    5, 
    If[
      kindsOfCoins == 3, 
      10, 
      If[
        kindsOfCoins == 4, 
        25, 
        50
      ]
    ]
  ]
];

countChange[100];
