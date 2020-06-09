let video; // setup initializes this to a p5.js Video instance.
let poses = []; // the poseNet.on callback sets this from new poses

export function setup() {
  createCanvas(640, 480, WEBGL);
  normalMaterial();

  video = select("video") || createCapture(VIDEO);
  video.size(width, height);

  const poseNet = ml5.poseNet(video, { flipHorizontal: true }, () => {
    select("#status").hide();
  });

  poseNet.on("pose", (newPoses) => {
    poses = newPoses;
  });

  // Hide the video element, and just show the canvas
  video.hide();
}

export function draw() {
  clear();

  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, width / 2, -height / 2);
  pop();
  return;
  translate(-width / 2, -height / 2, 0);
  orbitControl();

  drawKeypoints(poses);
  drawSkeleton(poses);
}

function drawKeypoints(poses) {
  for (let pose of poses) {
    for (let keypoint of pose.pose.keypoints) {
      if (keypoint.score > 0.2) {
        fill(0, 255, 0);
        noStroke();

        push();
        translate(keypoint.position.x, keypoint.position.y, 0);
        sphere(10);
        pop();
      }
    }
  }
}

function drawSkeleton(poses) {
  for (let pose of poses) {
    for (let skeleton of pose.skeleton) {
      const [p1, p2] = skeleton;
      stroke(255, 0, 0);
      line(p1.position.x, p1.position.y, p2.position.x, p2.position.y);
    }
  }
}
