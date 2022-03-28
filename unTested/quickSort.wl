quickSort[List[]] = {};

quickSort[
  Pattern[ary, List[BlankSequence[Integer]]]
] := With[
  {
    pivot = First[ary],
    rest = Rest[ary]
  },
  Join[ 
    quickSort[Select[rest, Function[x, x <= pivot]]], 
    { pivot }, 
    quickSort[Select[rest, Function[x, x > pivot]]] 
  ]
];


test[sampleSize_Integer] := <| 
  origin -> (
    ary = RandomInteger[{1, 50}, sampleSize]
  ), 
  sortedResult -> quickSort[ary] 
|>;

