Reduce[
  {
    EqualQ[
      Let[
        absOuter[x_] := If[x < 0, Negative[x], x],
        { absOuter[-4], absOuter[4], absOuter[0] }
      ], 
      { 4, 4, 0 }
    ],

    EqualQ[
      Map[
        Seq[-4, 4, 1],
        Function[x_, If[x<0, Negative[x], x]]
      ],
      { 4, 3, 2, 1, 0, 1, 2, 3, 4 }
    ],

    EqualQ[
      Let[
        abs[x_] := If[
          x < 0,
          Negative[x],
          x
        ],
        Map[Seq[-4, 4, 1], abs]
      ],
      { 4, 3, 2, 1, 0, 1, 2, 3, 4 }
    ],

    EqualQ[
      Function[{ Blank[], Blank[], c_, Blank[] }, c][
        { a, b, c, d }
      ],
      c
    ],

    EqualQ[
      Map[
        Filter[
          Seq[-3, 3, 1],
          Function[x_, x >= 0]
        ],
        Function[x_, x*x]
      ],
      { 0, 1, 4, 9 }
    ]
  },
  And, True
];
