let video; // setup initializes this to a p5.js Video instance.
let poses = []; // the poseNet.on callback sets this from new poses

// p5js calls this code once when the page is loaded (and, during development,
// when the code is modified.)
export function setup() {
  createCanvas(640, 480);
  video = select("video") || createCapture(VIDEO);
  video.size(width, height);

  // Create a new poseNet method with single-pose detection. The second argument
  // is a function that is called when the model is loaded. It hides the HTML
  // element that displays the "Loading model…" text.
  const poseNet = ml5.poseNet(video, () => { select("#status").hide() });

  // Every time we get a new set of poses, store them in the global variable `poses` so that .
  poseNet.on("pose", newPoses => { poses = newPoses });

  // Hide the video element, and just show the canvas
  video.hide();
}

// p5js calls this function once per animation frame.
export function draw() {
  // Modify the graphics context to flip all remaining drawing horizontally.
  // This makes the image act like a mirror (reversing left and right); this is
  // easier to work with.
  translate(width, 0); // move the left side of the image to the right
  scale(-1.0, 1.0);
  image(video, 0, 0, video.width, video.height);
  drawKeypoints(poses);
  drawSkeleton(poses);
}

// Draw ellipses over the detected keypoints
function drawKeypoints(poses) {
  for (let pose of poses) {
    for (let keypoint of pose.pose.keypoints) {
      if (keypoint.score > 0.2) {
        fill(0, 255, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// Draw connections between the skeleton joints.
function drawSkeleton(poses) {
  for (let pose of poses) {
    for (let skeleton of pose.skeleton) {
      // skeleton is an array of two keypoints. Extract the keypoints. This
      // syntax means set p1 to the first element of the array that is the value
      // of skeleton, and setting p2 to the second element.
      const [p1, p2] = skeleton;
      stroke(255, 0, 0);
      line(p1.position.x, p1.position.y, p2.position.x, p2.position.y);
    }
  }
}
