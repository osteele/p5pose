// import p5 from 'p5';
import * as sketch from './sketch';

// Force page refresh on hot reload
if (module.hot) {
    module.hot.accept(() => window.location.reload());
}

const s2 = (p5s) => {
  sketch.setSketch(p5s);
  p5s.setup = () => sketch.setup(sketch);
  p5s.draw = () => sketch.draw(sketch);
}

new p5(s2, 'container');
