const drawbox = document.querySelector('.drawbox');

var context = drawbox.getContext('2d');
context.imageSmoothingEnabled = false;

changeBoxSize();

console.log(drawbox.height);
console.log(drawbox.width);

var current = {
    color: 'black'
};

var drawing = false;

drawbox.addEventListener('mousedown', onMouseDown, false);
drawbox.addEventListener('mouseup', onMouseUp, false);
drawbox.addEventListener('mouseout', onMouseUp, false);
drawbox.addEventListener('mousemove', throttle(onMouseMove, 25), false);


drawbox.addEventListener('touchstart', onMouseDown, false);
drawbox.addEventListener('touchend', onMouseUp, false);
drawbox.addEventListener('touchcancel', onMouseUp, false);
drawbox.addEventListener('touchmove', throttle(onMouseMove, 25), false);

socket.on('drawing', onDrawingEvent);
socket.on('retrieveDrawing', (draw) => {
    draw.forEach(onDrawingEvent);
})

window.onresize = changeBoxSize;

function onMouseDown(e) {
    drawing = true;
    current.x = e.offsetX || e.touches[0].offsetX;
    current.y = e.offsetY || e.touches[0].offsetY;
}

function onMouseUp(e) {
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.offsetX || e.touches[0].offsetX, e.offsetY || e.touches[0].offsetY, current.color, true);
}

function onMouseMove(e) {
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.offsetX || e.touches[0].offsetX, e.offsetY || e.touches[0].offsetY, current.color, true);
    current.x = e.offsetX || e.touches[0].offsetX;
    current.y = e.offsetY || e.touches[0].offsetY;
}

function drawLine(x0, y0, x1, y1, color, emit) {
    console.log(x0 + ":" + y0);
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = drawbox.width;
    var h = drawbox.height;

    socket.emit('drawing', {
        username: localStorage.username,
        token: localStorage.token,
        channel: game_id,
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color
    });
}

function onDrawingEvent(data) {
    var w = drawbox.width;
    var h = drawbox.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
}


function changeBoxSize(){
    console.log("Size changed !");
    socket.emit('retrieveDrawing', {
        username: localStorage.username,
        token: localStorage.token,
        channel: game_id
    })
    drawbox.height = drawbox.parentElement.offsetHeight;
    drawbox.width = drawbox.parentElement.offsetWidth;
}

function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function () {
        var time = new Date().getTime();

        if ((time - previousCall) >= delay) {
            previousCall = time;
            callback.apply(null, arguments);
        }
    };
}