coinChange[amount_, kindsOfCoins_] := If[
  amount == 0,
  1,
  If[
    amount < 0,
    0,
    If[
      kindsOfCoins == 0,
      0,
      coinChange[amount, kindsOfCoins - 1] + coinChange[amount - firstDenomination[kindsOfCoins], kindsOfCoins]
    ]
  ]
];
firstDenomination[1]=1;
firstDenomination[1]=5;
firstDenomination[1]=10;
firstDenomination[1]=25;
firstDenomination[1]=50;
coinChange[100, 5];
