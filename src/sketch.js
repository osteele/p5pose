const scale = 1; // scale the video image

// video image dimensions
const width = 640 * scale;
const height = 480 * scale;

// setSketch (below) sets this to a p5 instance.
// In this file, the p5.js API functions are accessible as methods of this
// instance.
// See https://github.com/processing/p5.js/wiki/Global-and-instance-mode
let p5;

// setup initializes this to a p5.js Video instance.
let video;

// index.js calls this to set p5 to the current p5 sketch instance, so that
// setup and draw can access it.
export function setSketch(sketch) {
  p5 = sketch;
}

function makeSkeletonPairs() {
  const pairs = [];
  // TODO: LHand HeadSide LWristIn WaistLBackFront
  [
    'LToe LFoot LAnkleOut LKneeOut LShin LThigh Hip',
    'LFArm LWristOut LHandOut LWristIn',
    'LHand LWristIn',
  ].forEach((sequence) => {
    let prev = null;
    sequence.split(' ').forEach((name) => {
      if (prev) {
        pairs.push([prev, name]);
        if (prev[0] == 'L' && name[0] == 'L') {
          pairs.push(['R' + prev.slice(1), 'R' + name.slice(1)]);
        } else if (prev[0] == 'L') {
          pairs.push(['R' + prev.slice(1), name]);
        } else if (name[0] == 'L') {
          pairs.push([prev, 'R' + name.slice(1)]);
        }
      }
      prev = name;
    });
  });
  return pairs;
}

const skeletonPairs = makeSkeletonPairs();
// console.info(skeletonPairs);

function optitrack(elt, onLoad) {
  const width = elt.width;
  const height = elt.height;
  const ws = new WebSocket('ws://localhost:8765');
  const callbacks = [];
  const elapsedTimeScale = 5;

  const startTime = new Date();
  let cursor = 0;

  ws.onmessage = (event) => {
    const pose = JSON.parse(event.data);
    const byPart = {};
    pose.keypoints.forEach((kp) => {
      byPart[kp.part] = kp;
      const pos = kp.position;
      kp.pos = pos; // this is 3D position
      // create new 2D position
      kp.position = {
        x: (1 + pos.x) * width / 2,
        y: (1 - pos.z) * height / 2,
      };
    });
    const skeleton = [];
    skeletonPairs.forEach((names) => {
      const p1 = byPart[names[0]];
      const p2 = byPart[names[1]];
      if (p1 && p2) {
        skeleton.push([p1, p2]);
      }
    });
    let poses = [{ pose, skeleton }];
    callbacks.forEach((cb) => {
      p5.push();
      try {
        cb(poses);
      } finally {
        p5.pop();
      }
    });
  };

  function requestData() {
    const elapsed = new Date() - startTime;
    if (ws.readyState == 1) {
      if (onLoad) {
        onLoad();
        onLoad = null;
      }
      ws.send(JSON.stringify({ elapsed, cursor }));
      cursor += elapsedTimeScale;
    }
    requestAnimationFrame(requestData);
  }
  requestAnimationFrame(requestData);
  // setInterval(requestData, 10);

  return {
    on: (eventType, cb) => callbacks.push(cb),
  };
}

// p5js calls this code once when the page is loaded (and, during
// development, when the code is modified.)
export function setup() {
  p5.createCanvas(width, height);
  video = p5.select('video') || p5.createCapture(p5.VIDEO);
  video.size(width, height);

  // Create a new poseNet method with single-pose detection.
  // The second argument is a function that is called when the model is
  // loaded. It hides the HTML element that displays the "Loading model…" text.
  // const poseNet = ml5.poseNet(video, () => p5.select('#status').hide());
  const poseNet = optitrack(video, () => p5.select('#status').hide());

  // Every time we get a new pose, apply the function `drawPoses` to it
  // (call `drawPoses(poses)`) to draw it.
  poseNet.on('pose', drawPoses);

  // Hide the video element, and just show the canvas
  video.hide();
}

// p5js calls this function once per animation frame. In this program, it
// does nothing---instead, the call to `poseNet.on` in `setup` (above) specifies
// a function that is applied to the list of poses whenever PoseNet processes
// a video frame.
export function draw() { }

function drawPoses(poses) {
  // Modify the graphics context to flip all remaining drawing horizontally.
  // This makes the image act like a mirror (reversing left and right); this
  // is easier to work with.
  p5.translate(width, 0); // move the left side of the image to the right
  p5.scale(-1.0, 1.0);
  // p5.image(video, 0, 0, video.width, video.height);
  p5.rect(0, 0, video.width, video.height);
  drawKeypoints(poses);
  drawSkeleton(poses);
}

// Draw ellipses over the detected keypoints
function drawKeypoints(poses) {
  poses.forEach((pose) =>
    pose.pose.keypoints.forEach((keypoint) => {
      if (keypoint.score > 0.2) {
        p5.fill(0, 255, 0);
        p5.noStroke();
        p5.ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    })
  );
}

// Draw connections between the skeleton joints.
function drawSkeleton(poses) {
  poses.forEach((pose) => {
    pose.skeleton.forEach((skeleton) => {
      // skeleton is an array of two keypoints. Extract the keypoints.
      const [p1, p2] = skeleton;
      p5.stroke(255, 0, 0);
      p5.line(p1.position.x, p1.position.y, p2.position.x, p2.position.y);
    });
  });
}
