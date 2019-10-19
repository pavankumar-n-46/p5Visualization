// The serviceUuid must match the serviceUuid of the device you would like to connect
const serviceUuid = "0000ffb0-0000-1000-8000-00805f9b34fb";
let myBLE;
let isConnected = false;
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

    // Create a p5ble class
    myBLE = new p5ble();

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


function avg(v) {
    return v.reduce((a, b) => a + b, 0) / v.length;
}

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

function connectAndStartNotify() {
    // Connect to a device by passing the service UUID
    myBLE.connect(serviceUuid, gotCharacteristics);
}

// A function that will be called once got characteristics
function gotCharacteristics(error, characteristics) {
    if (error) console.log('error: ', error);
    console.log('characteristics: ', characteristics);
    myCharacteristic = characteristics[0];
    // Start notifications on the first characteristic by passing the characteristic
    // And a callback function to handle notifications
    myBLE.startNotifications(myCharacteristic, handleNotifications);
    // You can also pass in the dataType
    // Options: 'unit8', 'uint16', 'uint32', 'int8', 'int16', 'int32', 'float32', 'float64', 'string'
    // myBLE.startNotifications(myCharacteristic, handleNotifications, 'string');
}

// A function that will be called once got characteristics
function handleNotifications(data) {
    console.log('data: ', data);
    if (dataBuffer.length < 8) {
        dataBuffer.push(data);
    }
    else {
        dataBuffer.shift()
        dataBuffer.push(data);
    }
    //myValue = data;
    if (dataBuffer.length > 7) {
        var smoothData = smoothOut(dataBuffer, 0.85);
        myValue = smoothData[0];
    }

}

// A function to stop notifications
function stopNotifications() {
    myBLE.stopNotifications(myCharacteristic);
}

// A function to copy data from myValue to myValue from past every 5 seconds
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