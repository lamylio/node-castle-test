/* Largement inspiré de la démo de socket.io (lol) */

const drawbox = document.querySelector('.drawbox');
const colors = {
    selector: document.querySelector('.colorzone'),
    values: [  
        ["#154360", "#1F618D", "#5499C7", "#5DADE2", "#73C6B6", "#229954", "#196F3D", "#145A32"],
        ["#512E5F", "#884EA0", "#BB8FCE", "#D7BDE2", "#F7DC6F", "#F1C40F", "#B7950B", "#9C640C"],
        ["#641E16", "#922B21", "#C0392B", "#EC7063", "#DC7633", "#D35400", "#A04000", "#6E2C00"],
    ]
}

let context = drawbox.getContext('2d');
context.imageSmoothingEnabled = false;

/* TEMP */
let canDraw = true;

const TOOLS = {
    PEN: 0,
    ERASER: 1,
    BUCKET: 2
}

let drawing = false;
let current = {
    color: 'black',
    size: 2,
    tool: TOOLS.PEN
};

/* Register events */

drawbox.addEventListener('mousedown', onMouseDown, false);
drawbox.addEventListener('mouseup', onMouseUp, false);
drawbox.addEventListener('mouseout', onMouseUp, false);
drawbox.addEventListener('mousemove', throttle(onMouseMove, 20), false);

drawbox.addEventListener('touchstart', onMouseDown, false);
drawbox.addEventListener('touchend', onMouseUp, false);
drawbox.addEventListener('touchcancel', onMouseUp, false);
drawbox.addEventListener('touchmove', throttle(onMouseMove, 10), false);

window.onwheel = throttle(onMouseWheel, 25);
window.onresize = changeBoxSize;
changeBoxSize();

/* Set up the colors palette */

for (let i = 0; i < colors.values.length; i++) {
    let ul = createCustomElement('ul', colors.selector, {class: ["colors"]});
    for(let j = 0; j < colors.values[0].length; j++){
        let li = createCustomElement('li', ul, {class: ["color"], color: colors.values[i][j], backgroundColor: colors.values[i][j]})
    }
}

for(color of document.querySelectorAll('.color')){
    color.addEventListener('click', onColorUpdate, false);
}

/* Socket */

socket.on('drawing', onDrawingEvent);
socket.on('retrieveDrawing', (draw) => {
    draw.forEach(onDrawingEvent);
})

/* Functions triggered by events */

function onMouseDown(e) {
    e.preventDefault();
    drawing = true;
    current.x = e.offsetX || e.touches[0].clientX - drawbox.offsetLeft;
    current.y = e.offsetY || e.touches[0].clientY - drawbox.offsetTop + window.scrollY;
}

function onMouseUp(e) {
    if (!drawing || !canDraw) { return; }
    e.preventDefault();
    drawing = false;
    drawLine(current.x, current.y, e.offsetX || e.touches[0].clientX - drawbox.offsetLeft, e.offsetY || e.touches[0].clientY - drawbox.offsetTop + window.scrollY, current.color, current.size, current.tool, true);
}

function onMouseMove(e) {
    if (!drawing || !canDraw) { return; }
    e.preventDefault();
    drawLine(current.x, current.y, e.offsetX || e.touches[0].clientX - drawbox.offsetLeft, e.offsetY || e.touches[0].clientY - drawbox.offsetTop + window.scrollY, current.color, current.size, current.tool, true);
    current.x = e.offsetX || e.touches[0].clientX - drawbox.offsetLeft;
    current.y = e.offsetY || e.touches[0].clientY - drawbox.offsetTop + window.scrollY;
}

function drawLine(x0, y0, x1, y1, color, size, tool, emit) {

    context.fillStyle = color;
    context.strokeStyle = color;
    context.lineWidth = size;

    context.arc(x0, y0, size/2, 0, 2*Math.PI);
    context.fill();

    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
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
        size: size,
        tool: tool,
        color: color
    });
}

function onDrawingEvent(data) {
    var w = drawbox.width;
    var h = drawbox.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.size, data.tool);
}

function onColorUpdate(e) {
    current.color = e.target.getAttribute('color');
}

function onMouseWheel(e){
    wUp = e.wheelDelta > 0 ? true : false;
    if(wUp){
        current.size+=1;
    }else{
        if(current.size == 1) return; 
        current.size-=1;
    }
}

function changeBoxSize(){
    socket.emit('retrieveDrawing', {
        username: localStorage.username,
        token: localStorage.token,
        channel: game_id
    })
    drawbox.height = drawbox.parentElement.offsetHeight;
    drawbox.width = drawbox.parentElement.offsetWidth;
}