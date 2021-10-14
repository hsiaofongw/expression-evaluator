import { Separator } from 'src/tokens';

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
    name: 'LeftParentheses',
  },
  {
    regex: /\)/g,
    name: 'RightParentheses',
  },
  {
    regex: /\s+/g,
    name: 'Space',
  },
];
