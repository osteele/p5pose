let video; // setup initializes this to a p5.js Video instance.
let poses = []; // the poseNet.on callback sets this from new poses
let buttonBounds = { x: 100, y: 100, width: 150, height: 50 };
let buttonIsPressed = false;

function setup() {
  createCanvas(640, 480);
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

function draw() {
  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0);
  pop();
  image(video, 0, 0, video.width, video.height);

  let contact = collidePoseBounds('rightWrist', buttonBounds);
  if (contact !== null) { buttonIsPressed = contact; }

  fill('white');
  if (buttonIsPressed) {
    fill('blue');
  }
  stroke('black');
  rect(buttonBounds.x, buttonBounds.y, buttonBounds.width, buttonBounds.height);

  drawKeypoints(poses);
  drawSkeleton(poses);
}

// returns true, false, or null
function collidePoseBounds(keypoint, bounds) {
  let contact = null;
  for (let pose of poses) {
    let rightWrist = pose.pose[keypoint];
    if (rightWrist.confidence >= 0.2) {
      contact = collidePointRect(rightWrist.x, rightWrist.y, bounds.x, bounds.y, bounds.width, bounds.height)
      if (contact) { return true; }
    }
  }
  return contact
}

function drawKeypoints(poses) {
  for (let pose of poses) {
    for (let keypoint of pose.pose.keypoints) {
      if (keypoint.score > 0.2) {
        noStroke();
        fill(0, 255, 0);
        if (keypoint.part == 'rightWrist') { fill('red'); }
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
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
