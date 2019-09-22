import * as sketch from './sketch';

// Force page refresh on hot reload
if (module.hot) {
  module.hot.accept(() => window.location.reload());
}

const s2 = (p5s) => {
  sketch.setSketch(p5s);
  Object.keys(sketch).forEach((k) => {
    p5s[k] = sketch[k];
  });
};

// eslint-disable-next-line new-cap
new p5(s2, 'container');
