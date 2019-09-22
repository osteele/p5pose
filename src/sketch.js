import * as optitrack from './optitrack';

const scale = 1; // scale the video image

// video image dimensions
const width = 640 * scale;
const height = 480 * scale;
let slider;

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

// p5js calls this code once when the page is loaded (and, during
// development, when the code is modified.)
export function setup() {
  p5.createCanvas(width, height);
  video = p5.select('video') || p5.createCapture(p5.VIDEO);
  video.size(width, height);

  // const img = p5.createImg(require('./star.jpg'), 10);
  // img.mousePressed(() => {
  //   console.log('Star pressed');
  // });

  // Create a new poseNet method with single-pose detection.
  // The second argument is a function that is called when the model is
  // loaded. It hides the HTML element that displays the "Loading model…" text.
  // const poseNet = ml5.poseNet(video, () => p5.select('#status').hide());
  const poseNet = optitrack.poseNet(video, { p5 },
    () => p5.select('#status').hide());

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
  if (poses[0] && poses[0].frameCount) {
    if (!slider) {
      slider = p5.createSlider(0, poses[0].frameCount - 1);
      slider.position(10, height + 20);
    }
    slider.value(poses[0].frameNumber);
  }
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
        const { x, y } = keypoint.position;
        p5.fill(0, 255, 0);
        p5.noStroke();
        // p5.ellipse(x, y, 10, 10);
        p5.text(keypoint.part, x, y);
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
