
let dataBuffer = [];
let myValue = 0;
let myValueFromPast = 0;
let time = 5000; // Lets adjust time interval sensor data is copied 

let x = [],
    y = [],
    segNum = 20,
    segLength = 18;

for (let i = 0; i < segNum; i++) {
    x[i] = 0;
    y[i] = 0;
}

function setup() {
    // Set up timeInterval which will copy data every 5 seconds
    setInterval(copyOldData, time);

    // Create a 'Connect and Start Notifications' button
    const connectButton = createButton('Connect and Start Notifications')
    connectButton.mousePressed(connectAndStartNotify);

    // Create a 'Stop Notifications' button
    const stopButton = createButton('Stop Notifications')
    stopButton.mousePressed(stopNotifications);

    //canvas setup
    createCanvas(windowWidth, windowHeight);
    strokeWeight(9);
    stroke(255, 100);
}

function connectAndStartNotify() {
    let serviceUuid = '0xffb0';
    if (serviceUuid.startsWith('0x')) {
        serviceUuid = parseInt(serviceUuid);
    }

    let characteristicUuid = '0xffb3';
    if (characteristicUuid.startsWith('0x')) {
        characteristicUuid = parseInt(characteristicUuid);
    }

    log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({ filters: [{ services: [serviceUuid] }] })
        .then(device => {
            log('Connecting to GATT Server...');
            return device.gatt.connect();
        })
        .then(server => {
            log('Getting Service...');
            return server.getPrimaryService(serviceUuid);
        })
        .then(service => {
            log('Getting Characteristic...');
            return service.getCharacteristic(characteristicUuid);
        })
        .then(characteristic => {
            myCharacteristic = characteristic;
            return myCharacteristic.startNotifications().then(_ => {
                log('> Notifications started');
                myCharacteristic.addEventListener('characteristicvaluechanged',
                    handleNotifications);
            });
        })
        .catch(error => {
            log('Argh! ' + error);
        });
}

function stopNotifications() {
    if (myCharacteristic) {
        myCharacteristic.stopNotifications()
            .then(_ => {        
                log('> Notifications stopped');
                myCharacteristic.removeEventListener('characteristicvaluechanged',
                    handleNotifications);
            })
            .catch(error => {
                log('Argh! ' + error);
            });
    }
}

function handleNotifications(event) {

    let value = event.target.value;
    let a = [];
    // Convert raw data bytes to hex values just for the sake of showing something.
    // In the "real" world, you'd use data.getUint8, data.getUint16 or even
    // TextDecoder to process raw data bytes.
    for (let i = 0; i < 1; i++) {
        console.log(value.getUint8(i).toString());
        myValue = parseInt(value.getUint8(i).toString());
      }

}

// Utility function
function avg(v) {
    return v.reduce((a, b) => a + b, 0) / v.length;
}

// Function to smoothout value in array
function smoothOut(vector, variance) {
    var t_avg = avg(vector) * variance;
    var ret = Array(vector.length);
    for (var i = 0; i < vector.length; i++) {
        (function () {
            var prev = i > 0 ? ret[i - 1] : vector[i];
            var next = i < vector.length ? vector[i] : vector[i - 1];
            ret[i] = avg([t_avg, avg([prev, vector[i], next])]);
        })();
    }
    return ret;
}

function copyOldData() {
    myValueFromPast = myValue;
}

function draw() {
    background(0);
    //append the sensor data here.
    dragSegment(0, myValue, myValueFromPast);
    for (let i = 0; i < x.length - 1; i++) {
        dragSegment(i + 1, x[i], y[i]);
    }
}

function dragSegment(i, xin, yin) {
    const dx = xin - x[i];
    const dy = yin - y[i];
    const angle = atan2(dy, dx);
    x[i] = xin - cos(angle) * segLength;
    y[i] = yin - sin(angle) * segLength;
    segment(x[i], y[i], angle);
}

function segment(x, y, a) {
    push();
    translate(x, y);
    rotate(a);
    line(0, 0, segLength, 0);
    pop();
}