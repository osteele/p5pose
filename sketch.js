let video; // setup initializes this to a p5.js Video instance.
let minScore = 0.2;
let lastPose = null; // the poseNet.on callback sets this from new poses
let maxBoneLengths = {};

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
      let pose = poses[0];
      updateBoneLengths(maxBoneLengths, pose);
      normalizePose(pose);
      add3d(pose);
      adjustBoneLengths(pose, maxBoneLengths);
      lastPose = pose;
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

function drawKeypoints(pose) {
  fill("blue");
  noStroke();

  for (let kp of pose.pose.keypoints) {
    if (kp.score >= minScore) {
      let { x, y, z } = kp.pos3;
      push();
      translate(x, y, z);
      rotateX(PI / 2);
      cone(10, 20);
      pop();
    }
  }
}

function drawSkeleton(pose) {
  stroke(255, 0, 0);
  for (let skeleton of pose.skeleton) {
    const [{ pos3: p1 }, { pos3: p2 }] = skeleton;
    line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
  }
}

// Update maxBoneLengths with the maximum observed 2D bone length
function updateBoneLengths(maxBoneLengths, pose) {
  for (let skeleton of pose.skeleton) {
    const [k1, k2] = skeleton;
    if (min(k1.score, k2.score) < minScore) continue;
    let boneName = `${k1.part}-${k2.part}`;
    let boneLen = maxBoneLengths[boneName] || 0;
    let newLen = createVector(k1.position.x, k1.position.y).dist(
      createVector(k2.position.x, k2.position.y)
    );
    if (newLen > boneLen) {
      maxBoneLengths[boneName] = newLen;
    }
  }
}

// Change pose.pose[n], pose.pose[partName], and pose.skeleton[i][j] to all
// refer to the same objects
function normalizePose(pose) {
  for (let kp of pose.pose.keypoints) {
    pose.pose[kp.part] = kp;
  }
  for (let sk of pose.skeleton) {
    sk[0] = pose.pose[sk[0].part];
    sk[1] = pose.pose[sk[1].part];
  }
}

let partZ = {
  shoulder: 1,
  elbow: 2,
  wrist: 3,
  hip: 1,
  knee: 2,
  ankle: 3,
  nose: 20,
  ear: -10,
};
partZ.leftHip = -partZ.hip;
partZ.leftShoulder = -partZ.shoulder;

// Add p5.Vector `pos3` property
function add3d(pose) {
  for (let kp of pose.pose.keypoints) {
    let { x, y } = kp.position;
    let partKey = kp.part.replace(/^(left|right)/, "").toLowerCase();
    let z = partZ[kp.part] || partZ[partKey] || 0;
    kp.pos3 = createVector(x, y, z);
  }
}

function adjustBoneLengths(pose, boneLengths) {
  for (let skel of pose.skeleton) {
    let [k1, k2] = skel;
    let [{ pos3: p1 }, { pos3: p2 }] = skel;
    let boneName = `${k1.part}-${k2.part}`;
    let boneLen = boneLengths[boneName];
    let curLen = p1.dist(p2);
    if (min(k1.score, k2.score) >= minScore && curLen < boneLen) {
      let zAdjust = (boneLen - curLen) / 2;
      p1.z -= zAdjust;
      p2.z += zAdjust;
    }
  }
}
