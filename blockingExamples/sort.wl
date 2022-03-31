EqualQ[
  Let[
    sort[lst_] := If[
      Length[lst] == 0, 
      {},
      Let[
        first = First[lst],
        rest=Rest[lst],
        ListJoin[
          ListJoin[
            sort[Filter[rest, Function[x_, x <= first]]], 
            { first }
          ],
          sort[Filter[rest, Function[x_, x > first]]]
        ]
      ]
    ],
    sort[{3,18,9,2,1,5,10,0,6,2,4,8}]
  ],
  List[0, 1, 2, 2, 3, 4, 5, 6, 8, 9, 10, 18]
];
