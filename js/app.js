let captureWidth = 1280;
let captureHeight = 720;

let imageWidth = 640;
let imageHeight= 360;

let statsConfig = {
    left: 0,
    top: 0,
    width: 140,
    height: imageHeight,
    fill: 'rgba(64, 64, 64, 0.5)',
    color: 'rgb(255, 255, 255)'
};

/*
 * Works for 640x360. Resize if imageWidth / imageHeight are
 * not 640x360.
 *
 * XXX Gah, don't be lazy, write some code to do this.
 */
let labelConfig = {
    elapsedTime: {
        label: { left: 5, top: 20, textSize: 10 },
        value: { left: 5, top: 40, textSize: 20 }
    },
    distance: {
        label: { left: 5, top: 65, textSize: 10 },
        value: { left: 5, top: 85, textSize: 20 }
    },
    currentPace: {
        label: { left: 5, top: 110, textSize: 10 },
        value: { left: 5, top: 130, textSize: 20 }
    },
    strokeRate: {
        label: { left: 5, top: 155, textSize: 10 },
        value: { left: 5, top: 175, textSize: 20 }
    },
    strokePower: {
        label: { left: 5, top: 200, textSize: 10 },
        value: { left: 5, top: 220, textSize: 20 }
    },
    averagePace: {
        label: { left: 5, top: 245, textSize: 10 },
        value: { left: 5, top: 265, textSize: 20 }
    },
    averagePower: {
        label: { left: 5, top: 290, textSize: 10 },
        value: { left: 5, top: 310, textSize: 20 }
    }
};

let capture;

function setup() {
    let canvas = createCanvas(imageWidth, imageHeight);
    canvas.parent('sketch-holder');

    capture = createCapture({
        audio: true,
        video: {
            width: { min: 640, ideal: captureWidth, max: 1920 },
            height: { min: 480, ideal: captureHeight, max: 1080 }
        }
    }, function(stream) {
        console.log(capture.width, capture.height);
    });
    capture.hide();
}

function draw() {
    image(capture, 0, 0, imageWidth, imageHeight);
    drawStats();
}

function drawStats() {
    strokeWeight(0);
    fill(statsConfig.fill);
    rect(statsConfig.left, statsConfig.top, statsConfig.width, statsConfig.height);

    fill(statsConfig.color);

    for (let k in labelConfig) {
        if (shared.hasOwnProperty(k)) {
            textSize(labelConfig[k].label.textSize);
            text(pm5fields[k].label, labelConfig[k].label.left, labelConfig[k].label.top);

            textSize(labelConfig[k].value.textSize);
            text(pm5fields[k].printable(shared[k]), labelConfig[k].value.left, labelConfig[k].value.top);
        }
    }
}


let shared = {};
let toShared = function(k, v) {
    shared[k] = v;
}

let cbConnecting = function() {
    document.querySelector('#connect').innerText = 'Connecting';
    document.querySelector('#connect').disabled = true;
};

let cbConnected = function() {
    document.querySelector('#connect').innerText = 'Disconnect';
    document.querySelector('#connect').disabled = false;
};

let cbDisconnected = function() {
    document.querySelector('#connect').innerText = 'Connect';
    document.querySelector('#connect').disabled = false;
};

let cbMessage = function(m) {
    for (let k in m.data) {
        if (m.data.hasOwnProperty(k)) {
            toShared(k, m.data[k]);
        }
    }
};

let chunks = [];
let recorder;
let m;

document.addEventListener('DOMContentLoaded', function() {
    if (navigator.bluetooth) {
        m = new PM5(cbConnecting, cbConnected, cbDisconnected, cbMessage);

        document.querySelector('#connect').addEventListener('click', function() {
            if (m.connected()) {
                m.doDisconnect();
            } else {
                m.doConnect();
            }
        });
    } else {
        alert('Web Bluetooth is not supported! You need a browser and ' +
                'platform that supports Web Bluetooth to use this application.');
        document.querySelector('#connect').disabled = true;
    }

    /*
     */
    document.querySelector('#startRecord').addEventListener('click', function(e) {
        document.querySelector('#startRecord').style.display = 'none';
        document.querySelector('#stopRecord').style.display = 'inline-block';
        document.querySelector('#downloadLink').style.display = 'none';

        chunks.length = 0;
        let stream = document.querySelector('#defaultCanvas0').captureStream();
        recorder = new MediaRecorder(stream);
        recorder.addEventListener('dataavailable', function(e) {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        });
        recorder.start();
    });
    document.querySelector('#stopRecord').addEventListener('click', function(e) {
        document.querySelector('#startRecord').style.display = 'inline-block';
        document.querySelector('#stopRecord').style.display = 'none';

        recorder.stop();
        recorder.addEventListener('stop', function(e) {
            let downloadLink = document.querySelector('#downloadLink');
            downloadLink.href = URL.createObjectURL(new Blob(chunks));
            downloadLink.download = 'video.webm';

            downloadLink.style.display = 'inline-block';
            chunks = [];
        });
    });
});
