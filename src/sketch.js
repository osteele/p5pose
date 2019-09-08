const scale = 1; // scale the video image

// video image dimensions
const width = 640 * scale;
const height = 480 * scale;

// setSketch (below) sets this to a p5 instance.
// In this file, the p5.js API functions are accessible as methods of this
// instance.
// See https://github.com/processing/p5.js/wiki/Global-and-instance-mode
let p5;

// setup initializes these variables
let video; // a p5.js Video instance
let label;
let osc;

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

  // Create a new poseNet method with single-pose detection.
  // The second argument is a function that is called when the model is
  // loaded. It hides the HTML element that displays the "Loading model…" text.
  const poseNet = ml5.poseNet(video, () => p5.select('#status').hide());

  // Every time we get a new pose, apply the function `drawPoses` to it
  // (call `drawPoses(poses)`) to draw it.
  poseNet.on('pose', drawPoses);

  // Hide the video element, and just show the canvas
  video.hide();

  // Create an audio oscillator.
  // Web browsers won't let a web page play audio until the user has interacted
  // with the page, so make a button; when the user clicks on the button,
  // the program will initialize the oscillator (`osc`).
  const audioButton = p5.createButton('click to start audio');
  audioButton.position(5, height + 100);
  audioButton.mouseClicked(() => {
    p5.userStartAudio().then(() => {
      audioButton.remove();
      osc = new window.p5.Oscillator();
      osc.amp(0);
      osc.start();
    });
  });

  label = p5.createDiv();
  label.position(5, height + 50);
  label.style('font-size', '24pt');
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
  p5.image(video, 0, 0, video.width, video.height);
  drawKeypoints(poses);
  drawSkeleton(poses);
  updateAudio(poses);
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

function updateAudio(poses) {
  // Return if the oscillator hasn't been initialized
  if (!osc) {
    return;
  }
  // Was any pose detected? if not, mute the oscillator, and return.
  if (poses.length == 0) {
    osc.amp(0);
    return;
  }
  // extract the first pose
  const pose = poses[0].pose;
  // find the left and right wrists. The numbers 9 and 10 are from the PoseNet documentation
  // https://github.com/tensorflow/tfjs-models/tree/master/posenet
  const wrist1 = pose.keypoints[9];
  const wrist2 = pose.keypoints[10];
  // compute the horizontal distance between the wrists
  const dx = wrist2.position.x - wrist1.position.x;
  // scale this distance to a number between 0 and 1, based on the maximum possible distance
  const scaled = Math.abs(dx) / width;
  // turn this into a pitch between C1 and C5 (see https://en.wikipedia.org/wiki/Scientific_pitch_notation)
  const octave = 2 + 4 * scaled;
  const freq = 16.352 * 2 ** octave;
  // slide the oscillator frequency towards the new frequency
  osc.freq(0.9 * osc.getFreq() + 0.1 * freq);

  // compute an amplitude based on the average wrist height
  const avgWristY = (wrist1.position.y + wrist2.position.y) / 2;
  // y increases towards the window bottom. Flip it to get a height. Also scale to the range [0, 1].
  const amp = 1 - avgWristY / height;
  // slide the oscillator amplitude towards the new amplitude
  osc.amp(0.9 * osc.getAmp() + 0.1 * amp);

  // for debugging
  label.html(`freq=${freq} amp=${amp}`);
}
