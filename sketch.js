let video; // setup initializes this to a p5.js Video instance.
let lastPose = null; // the poseNet.on callback sets this from new poses
let maxBoneLengths = {};
let skelPositions = {};

function setup() {
  createCanvas(640, 480, WEBGL);
  normalMaterial();

  video = createCapture(VIDEO);
  video.size(width, height);

  const poseNet = ml5.poseNet(
    video,
    { flipHorizontal: true, detectionType: "single" },
    () => select("#status").hide()
  );

  poseNet.on("pose", (poses) => {
    if (poses.length > 0) {
      lastPose = poses[0];
      updateBoneLengths(lastPose);
    }
  });

  // Hide the video element, and just show the canvas
  video.hide();

  normalMaterial();
  debugMode();
}

function draw() {
  clear();

  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, width / 2, -height / 2);
  pop();

  translate(-width / 2, -height / 2, 0);

  ambientLight(60, 60, 60);
  pointLight(255, 255, 255, width / 2, height / 2, 100);

  if (lastPose) {
    drawKeypoints(lastPose);
    drawSkeleton(lastPose);
  }

  orbitControl();

  // these affect the debugMode grid
  stroke(0, 0, 0, 0.15); // FIXME: opacity is ignored
}
let minScore = 0.2;
function drawKeypoints(pose) {
  fill("blue");
  // console.log(pose);
  noStroke();

  for (let keypoint of pose.pose.keypoints) {
    if (keypoint.score >= minScore) {
      push();
      translate(keypoint.position.x, keypoint.position.y, 0);
      rotateX(PI);
      cone(20, 10);
      pop();
    }
  }
}

function drawSkeleton(pose) {
  stroke(255, 0, 0);
  for (let skeleton of pose.skeleton) {
    const [{ position: p1 }, { position: p2 }] = skeleton;
    line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
  }
}

function updateBoneLengths(pose) {
  for (let skeleton of pose.skeleton) {
    const [p1, p2] = skeleton;
    if (p1.score < minScore || p2.score < minScore) continue;
    let boneName = `${p1.part}-${p2.part}`;
    let lastLength = maxBoneLengths[boneName] || 0;
    let length = createVector(p1.position.x, p1.position.y).dist(
      createVector(p2.position.x, p2.position.y)
    );
    if (length > lastLength) {
      // console.log("new length", boneName, length);
      maxBoneLengths[boneName] = length;
    }
  }
}
