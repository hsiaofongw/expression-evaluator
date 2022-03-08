firstDenomination[kindOfCoins_] := If[
  kindOfCoins == 1, 
  1, 
  If[
    kindOfCoins == 2, 
    5, 
    If[
      kindOfCoins == 3, 
      10, 
      If[
        kindOfCoins == 4, 
        25, 
        50
      ]
    ]
  ]
];
