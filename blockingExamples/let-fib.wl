
Let[
  fib2[1] = 1,
  Let[
    fib2[2] = 1,
    Let[
      fib2[n_] := fib2[n-1] + fib2[n-2],
      Map[Seq[8], fib2]
    ]
  ]
];

EqualQ[
      Let[
        fib2[1] = 1,
        Let[
          fib2[2] = 1,
          Let[
            fib2[n_] := fib2[n-1] + fib2[n-2],
            {
              EqualQ[Map[Seq[8], fib2], { 1, 1, 2, 3, 5, 8, 13, 21 }],
              Reduce[Map[Seq[8], validate], And, True]
            }
          ]
        ]
      ],
      { True, True }
    ]