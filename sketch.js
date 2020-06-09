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
      updateBoneLengths(pose);
      normalizePose(pose);
      add3d(pose);
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
  // console.log(pose);
  noStroke();

  for (let keypoint of pose.pose.keypoints) {
    if (keypoint.score >= minScore) {
      push();
      translate(keypoint.pos3.x, keypoint.pos3.y, 0);
      rotateX(PI);
      cone(20, 10);
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

// Add p5.Vector `pos3` property
function add3d(pose) {
  let partZ = {
    shoulder: 1,
    elbow: 2,
    wrist: 3,
    hip: 1,
    knee: 2,
    ankle: 3,
  };
  partZ.leftHip = -partZ.hip;
  partZ.leftShoulder = -partZ.shoulder;
  for (let kp of pose.pose.keypoints) {
    let { x, y } = kp.position;
    let partKey = kp.part.replace(/^(left|right)/, "").toLowerCase();
    let z = partZ[kp.part] || partZ[partKey] || 0;
    kp.pos3 = createVector(x, y, z * 100);
  }
}
