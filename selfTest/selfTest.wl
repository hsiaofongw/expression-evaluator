Let[
  testList = {
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
    ],

    EqualQ[
      Let[
        f[x_] := x*x,
        Map[
          Filter[Seq[-3, 3, 1], Function[x_, x>=0]], 
          f
        ]
      ],
      { 0, 1, 4, 9 }
    ],

    EqualQ[
      Let[
        facIter[prod_, count_, max_] := If[
          count == max, 
          count * prod, 
          facIter[prod * count, count + 1, max]
        ],
        Let[
          factorial[n_] := facIter[1, 1, n],
          Map[Seq[6], factorial]
        ]
      ],
      { 1, 2, 6, 24, 120, 720 }
    ],

    EqualQ[
      Let[
        fib1[x_] := If[
          x == 1, 
          1, 
          If[
            x == 2, 
            1, 
            fib1[x-1] + fib1[x-2]
          ]
        ],
        Let[
          validate[n_] := EqualQ[fib1[n] + fib1[n+1], fib1[n+2]],
          And[
            EqualQ[
              Map[Seq[8], fib1],
              { 1, 1, 2, 3, 5, 8, 13, 21 }
            ],
            Reduce[
              Map[Seq[8], validate],
              And, True
            ]
          ]
        ]
      ],
      True
    ],

    EqualQ[
      Let[
        fib2[1] = 1,
        Let[
          fib2[2] = 1,
          Let[
            fib2[n_] := fib2[n-1] + fib2[n-2],
            Map[Seq[8], fib2]
          ]
        ]
      ],
      { 1, 1, 2, 3, 5, 8, 13, 21 }
    ],

    EqualQ[
      Let[
        fib2[1] = 1,
        Let[
          fib2[2] = 1,
          Let[
            fib2[n_] := fib2[n-1] + fib2[n-2],
            Let[
              validate[n_] := EqualQ[fib2[n] + fib2[n+1], fib2[n+2]],
              Reduce[Map[Seq[8], validate], And, True]
            ]
          ]
        ]
      ],
      True
    ],

    EqualQ[
      Map[{ a, b, c }, f],
      { f[a], f[b], f[c] }
    ],

    EqualQ[
      Map[Seq[-3, 3, 1], Function[x_, x*x]],
      { 9, 4, 1, 0, 1, 4, 9 }
    ],

    EqualQ[
      Reduce[{a, b, c}, f, init],
      f[f[f[init, a], b], c]
    ],

    EqualQ[
      Let[
        join[ { x___ }, { y___ } ] := { x, y },
        Let[
          seqIter[lst_, count_, max_] := If[
            count > max,
            lst,
            seqIter[join[lst, { count }], count + 1, max]
          ],
          Let[
            seq[n_] := seqIter[{}, 1, n],
            { 
              Map[seq[5], Function[y_, y*y]],
              Reduce[
                Map[seq[10], Function[y_, y*y]], 
                Function[a_, b_, a+b],
                0
              ],
              Let[
                filter[lst_, pred_] := Reduce[
                  lst,
                  Function[last_, curr_, If[pred[curr], join[last, { curr }], last]],
                  {}
                ],
                filter[Seq[5], Function[x_, x > 3]]
              ]
            }
          ]
        ]
      ],
      { { 1, 4, 9, 16, 25 }, 385, { 4, 5 } }
    ],

    EqualQ[
      Let[
        smallestDivisor[n_] := findDivisor[n, 2],
        Let[
          findDivisor[n_, testDivisor_] := If[
            GreaterThan[Square[testDivisor], n],
            n,
            If[
              divides[testDivisor, n],
              testDivisor,
              findDivisor[n, Plus[testDivisor, 1]]
            ]
          ],
          Let[
            divides[a_, b_] := EqualQ[Remainder[b, a], 0],
            Let[
              primeQ[n_] := And[n > 1, EqualQ[n, smallestDivisor[n]]],
              Filter[Seq[200], primeQ]
            ]
          ]
        ]
      ],
      List[
        2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61,
        67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 
        149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199
      ]
    ],

    EqualQ[
      {
        Seq[10],
        Seq[1, 5],
        Seq[1, 5, 2],
        Reduce[Seq[10], Function[x_, y_, x + y * y], 0],
        Let[f[x_] := x*x, Map[Seq[10], f]]
      },
      {
        List[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        List[1, 2, 3, 4, 5],
        List[1, 3, 5],
        385,
        List[1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
      }
    ],
    EqualQ[
      Let[
        gcd[x_, y_] := If[
          y == 0, 
          x, 
          gcd[y, x % y]
        ],
        {
          gcd[200, 175],
          gcd[18, 12],
          gcd[-10, 3],
          gcd[10, -3],
          gcd[9, -6],
          gcd[-6, 9],
          gcd[18, 24]
        }
      ],
      { 25, 6, -1, 1, 3, 3, 6 }
    ]
  },
  Reduce[testList, And, True]
];
