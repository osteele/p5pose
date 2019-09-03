// import "p5/lib/addons/p5.dom";

const scale = 1;
const width = 640 * scale;
const height = 480 * scale;

// setSketch sets this
let p5;

// setup initializes this
let video;

export function setSketch(sketch) {
  p5 = sketch;
}

export function setup() {
  p5.createCanvas(width, height);
  video = p5.select('video') || p5.createCapture(p5.VIDEO);
  video.size(width, height);

  // Create a new poseNet method with a single detection
  const poseNet = ml5.poseNet(video, () => p5.select('#status').hide());

  // Every time we get a new pose, draw it
  poseNet.on('pose', drawPoses);
  
  // Hide the video element, and just show the canvas
  video.hide();
}

export function draw() {
}

function drawPoses(poses) {
  p5.translate(width, 0); // move to far corner
  p5.scale(-1.0, 1.0);
  p5.image(video, 0, 0, video.width, video.height);
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
  )
}

function drawSkeleton(poses) {
    poses.forEach((pose) => {
      pose.skeleton.forEach((skeleton) => {
        const [p1, p2] = skeleton;
        p5.stroke(255, 0, 0);
        p5.line(p1.position.x, p1.position.y, p2.position.x, p2.position.y);
      });
    });
}
