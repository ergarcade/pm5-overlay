let captureWidth = 1280;
let captureHeight = 720;

let imageWidth = 640;
let imageHeight= 360;

const absMin = 999999;
const absMax = 0;

const rangeRestrict = (v, in_min, in_max, out_min, out_max) => {
  return (v - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

let Sparkline = (_label, _left, _top, _width, _height, _textSize, _valueSize) => {
    const _maxResults = _width;
    let _results = [];
    let _min = absMin;
    let _max = absMax;

    return {
        render: () => {
            /*
             * Container.
             */
            strokeWeight(0);
            fill('rgba(64, 64, 64, 0.5)');
            rect(_left, _top, _width, _height);

            /*
             * Sparkline.
             */
            strokeWeight(1);
            stroke('rgb(192, 0, 0)');
            _results.forEach((v, i) => {
                line(_left+i,
                    _top + _height,
                    _left+i,
                    rangeRestrict(v, _min, _max, _top+_height-1, _top+1));
            });

            /*
             * Label and value
             */
            strokeWeight(0);
            fill('rgb(192, 192, 192)');

            textSize(_textSize);
            textStyle(NORMAL);
            text(pm5fields[_label].label,
                _left + 5,
                _top + _textSize);

            textSize(_valueSize);
            textStyle(BOLD);
            if (_results.length) {
                text(pm5fields[_label].printable(_results[_results.length-1]),
                    _left + 5,
                    _top + 5 + 2 * _textSize);
            }
        },
        addResult: (v) => {
            _results.push(v);
            if (_results.length > _maxResults) {
                _results.shift();
            }
            _min = absMin;
            _max = absMax;
            _results.forEach((v, i) => {
                if (v < _min) {
                    _min = v;
                }
                if (v > _max) {
                    _max = v;
                }
            });
        }
    };
};
let sparklines = {
    'elapsedTime': '',
    'distance': '',
    'currentPace': '',
    'averagePace': '',
    'strokeRate': '',
    'strokePower': '',
    'strokeCalories': '',
    'totalCalories': '',
    'heartRate': '',
};

let capture;

function createSparklines() {
    let x = 5;
    let y = 5;
    let w = imageWidth / 6;
    let ts = imageHeight * 0.04;
    let vs = imageHeight * 0.05;
    let h = ts + vs + 5;

    console.log('calc', imageWidth, imageHeight);

    for (let l in sparklines) {
        sparklines[l] = Sparkline(l, x, y, w, h, ts, vs);
        y += h + 5;
    }
}

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
        resizeCanvas(capture.width, capture.height);
        imageWidth = capture.width;
        imageHeight = capture.height;

        createSparklines(); /* resize them */

    });
    capture.hide();

    resizeCanvas(imageWidth, imageHeight);
    frameRate(30);

    createSparklines();
}

function draw() {
    image(capture, 0, 0, imageWidth, imageHeight);
    for (const s in sparklines) {
        sparklines[s].render();
    }
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

    shared = {};
};

let cbMessage = function(m) {
    for (let k in m.data) {
        if (m.data.hasOwnProperty(k) && k in sparklines) {
            sparklines[k].addResult(m.data[k]);
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
