import { Separator } from 'src/types';

export const separators: Separator[] = [
  {
    regex: /\s+/g,
    name: 'Space',
  },
  {
    regex: /=/g,
    name: 'EqualSign',
  },
  {
    regex: /\d+/g,
    name: 'Number',
  },
  {
    regex: /\-\-[a-zA-Z]+/g,
    name: 'Option',
  },
  {
    regex: /(?<!\-)\-[a-z]+/g,
    name: 'Command',
  },
  {
    regex: /node/g,
    name: 'NodeExecutable',
  },
  {
    regex: /\/?(([a-z]+)\/)+([a-z]+)\.js/g,
    name: 'JavaScriptPath',
  },
];
