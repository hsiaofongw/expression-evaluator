import { Separator } from 'src/types/token';

export const separators: Separator[] = [
  {
    regex: /\d+/g,
    name: 'PositiveNumber',
  },
  {
    regex: /\+/g,
    name: 'Plus',
  },
  {
    regex: /\-/g,
    name: 'Minus',
  },
  {
    regex: /\*/g,
    name: 'Times',
  },
  {
    regex: /\//g,
    name: 'DivideBy',
  },
  {
    regex: /\(/g,
    name: 'LeftParenthesis',
  },
  {
    regex: /\)/g,
    name: 'RightParenthesis',
  },
  {
    regex: /\s+/g,
    name: 'Space',
  },
];
