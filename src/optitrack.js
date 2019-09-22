

/* Create a list [[jn1, jn2]] of joint-name pairs, for joints that are connected
 * to create the skeleton.
 */
function createJointPairs() {
    const left2right = (s) => s.replace(/^L/, 'R');
    const jointPairs = [];
    // Sequences of joint names. If the sequence contains a pair [jn1, jn2]
    // where either or both of jn1, jn2 begins with 'L', a pair where initial L
    // has been replaced by R is also added.
    [
        'LToe LFoot LAnkleOut LKneeOut LShin LThigh Hip',
        'LFoot LShin',
        'Hip Chest Neck LFArm LHand',
        'Neck Head',
        'LFArm LWristOut LHandOut LWristIn',
        'LHand LWristIn',
    ].forEach((jointChain) => {
        jointChain.split(' ').forEach((jn2, i, jointNames) => {
            if (i == 0) {
                return;
            }
            const jn1 = jointNames[i - 1];
            jointPairs.push([jn1, jn2]);
            if (jn1.match(/^L/) || jn2.match(/^L/)) {
                jointPairs.push([left2right(jn1), left2right(jn2)]);
            }
        });
    });
    return jointPairs;
}

const jointNamePairs = createJointPairs();

/**  An API to the OptiTrack data client.
 *
 * This API is compatible with the ml5.poseNet API https://ml5js.org/reference/api-PoseNet/.
 * If video is present.
 */
export function poseNet(videoOrOptionsOrCallback, optionsOrCallback, cb) {
    // if (videoOrOptionsOrCallback &&
    //     !(videoOrOptionsOrCallback instanceof HTMLVideoElement)) {
    //     return poseNet(null, optionsOrCallback, cb);
    // }
    if (typeof options === 'function') {
        return poseNet(video, {}, optionsOrCallback);
    }
    const { p5, frameRate, serverUrl } = optionsOrCallback;
    let video = videoOrOptionsOrCallback || { width: 1, height: 1 };
    const width = video.width;
    const height = video.height;
    const ws = new WebSocket(serverUrl || 'ws://localhost:8765');
    let onLoad = cb;
    const onPoseCallbacks = [];

    const startTime = new Date();
    let frameNumber = 0;


    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const { pose } = data;
        // Convert the 3D points into 2D
        pose.keypoints.forEach((kp) => {
            const pos = kp.position;
            kp.pos = pos; // this is original 3D position
            // create a new 2D position
            kp.position = {
                x: (1 + pos.x) * width / 2,
                y: (1 - pos.z) * height / 2,
            };
        });

        // create a dictionary indexed by part name, for constructing the
        // skeleton
        const keypointsByPartName = {};
        pose.keypoints.forEach((kp) => {
            keypointsByPartName[kp.part] = kp;
        });
        const skeleton =
            jointNamePairs.map((names) =>
                names.map((name) => keypointsByPartName[name])
            ).filter((keypoints) => keypoints.every((kp) => kp));

        // Create an array of poses, that emulates the PoseNet structure.
        let frameCount = data.frame_count;
        let poses = [{ frameCount, frameNumber: data.frame_number, pose, skeleton }];

        // apply the on('pose') callbacks
        onPoseCallbacks.forEach((cb) => {
            if (p5) {
                p5.push();
            }
            try {
                cb(poses);
            } finally {
                if (p5) {
                    p5.pop();
                }
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
            ws.send(JSON.stringify({ elapsed, frame_no: frameNumber }));
            frameNumber += frameRate || 1;
        }
        requestAnimationFrame(requestData);
    }
    requestAnimationFrame(requestData);

    return {
        on: (eventType, cb) => {
            if (eventType != 'pose') {
                throw new Exception(`Unknown listener: ${eventType}`);
            }
            onPoseCallbacks.push(cb);
        },
    };
}
