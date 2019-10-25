import * as sketch from './sketch';

Object.keys(sketch).forEach((key) =>
  global[key] = sketch[key]);
