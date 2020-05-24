dynamicallyLoadScript("/public/js/floodFill2D.js");

const drawbox = document.querySelector('.drawbox');
const drawzone = document.querySelector('.drawzone');
const range_pen_size = document.querySelector('#input_pen_size');

const colors = {
    selector: document.querySelector('.colorzone'),
    values: [
        ["#154360", "#1F618D", "#5499C7", "#5DADE2", "#73C6B6", "#229954", "#196F3D", "#145A32"],
        ["#512E5F", "#884EA0", "#BB8FCE", "#D7BDE2", "#F7DC6F", "#F1C40F", "#B7950B", "#9C640C"],
        ["#641E16", "#922B21", "#C0392B", "#EC7063", "#DC7633", "#D35400", "#A04000", "#6E2C00"],
    ]
}

const TOOLS = {
    PEN: 0,
    BUCKET: 1
}

let context, drawing, bucket, current;
document.body.onload = () => {

    context = drawbox.getContext('2d');
    context.imageSmoothingEnabled = false;

    drawing = false;
    bucket = false;
    current = {
        color: '#111000',
        colorElement: document.querySelector(".color.default"),
        size: 8,
        tool: TOOLS.PEN
    };

    changeBoxSize();
}

/* Register events */

drawzone.addEventListener('mousedown', onMouseDown, false);
drawzone.addEventListener('mouseup', onMouseUp, false);
drawzone.addEventListener('mouseout', onMouseUp, false);
drawzone.addEventListener('mousemove', throttle(onMouseMove, 20), false);

drawzone.addEventListener('touchstart', onMouseDown, false);
drawzone.addEventListener('touchend', onMouseUp, false);
drawzone.addEventListener('touchcancel', onMouseUp, false);
drawzone.addEventListener('touchmove', throttle(onMouseMove, 10), false);

drawzone.addEventListener("wheel", onMouseWheel, {passive: false});
window.onresize = changeBoxSize;

/* Set up the colors palette */

for (let i = 0; i < colors.values.length; i++) {
    let ul = createCustomElement('ul', colors.selector, {class: ["colors"]});
    for(let j = 0; j < colors.values[0].length; j++){
        let li = createCustomElement('li', ul, {class: ["color"], color: colors.values[i][j], backgroundColor: colors.values[i][j]})
    }
}

/* Palette events */

for(color of document.querySelectorAll('.colors')){
    color.addEventListener('click', onColorUpdate);
}

range_pen_size.onchange = (e) => {
    let factor = 4;
    if(e.target.value > 3) factor = 6;
    current.size = Math.floor(e.target.value*factor)||9;
    drawCursor();
}

function drawCursor(){
    let cursor_canva = document.createElement('canvas');
    let cursor_context = cursor_canva.getContext('2d');
    cursor_canva.height = cursor_canva.width = 50;

    cursor_context.fillStyle = current.color;
    cursor_context.strokeStyle = "black";
    cursor_context.arc(25, 25, current.size / 2, 0, 2 * Math.PI);
    cursor_context.stroke();
    cursor_context.beginPath();
    cursor_context.lineWidth = 2;
    cursor_context.strokeStyle = "white";
    cursor_context.arc(25, 25, (current.size-1) / 2, 0, 2 * Math.PI);
    cursor_context.stroke();
    cursor_context.beginPath();
    cursor_context.arc(25, 25, (current.size-3) / 2, 0, 2 * Math.PI);
    cursor_context.fill();
    cursor_context.closePath();

    let data = cursor_canva.toDataURL();
    drawzone.style.cursor = `url(${data}) 25 25, default`;
}

/* Socket */

socket.on('retrieve_drawing', throttle(retrieve, 10));

function retrieve(message){
    if (message.url){
        let i = new Image();
        i.src = message.url;
        i.onload = function () {
            context.drawImage(i, 0, 0, drawbox.width, drawbox.height);
        }
    }
}

socket.on('clean_drawing', () => {context.clearRect(0, 0, drawbox.width, drawbox.height)});


/* ----- */

async function useTool(x0, y0, x1, y1) {
    context.fillStyle = current.color;
    context.strokeStyle = current.color;
    context.lineWidth = current.size;
    context.globalAlpha = 1.0;

    switch (current.tool) {      
        case TOOLS.BUCKET:
            if(bucket) return;
            bucket = true;
            await floodFill.fill(x0, y0, 150, context, false, null, 20);  
            bucket = false;
        break;
        case TOOLS.PEN:
        default:
            context.arc(x0, y0, current.size/2, 0, 2*Math.PI);
            context.fill();
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.stroke();
            context.closePath();
            break;
    }

    socket.emit('drawing', {
        url: drawbox.toDataURL('image/webp', 1.0)
    });
}

/*  ----  */

function resetDrawbox(){
    socket.emit('clean_drawing');
}

function onColorUpdate(e) {
    current.colorElement.style.outline = "";
    current.colorElement = e.srcElement;
    current.color = e.srcElement.getAttribute('color');
    current.colorElement.style.outline = "#37474f solid 2px";
    drawCursor();
}

function onToolUpdate(e){
    let attr = e.getAttribute('tool');
    current.tool = TOOLS[attr];
    for (let t of document.querySelectorAll('.tool')) {
        t.style.opacity = "0.6";
    }
    e.style.opacity = "1";
}

function changeBoxSize(){
    drawbox.width = drawbox.parentElement.offsetWidth;
    drawbox.height = drawbox.parentElement.offsetHeight;
    socket.emit('retrieve_drawing', {
        token: localStorage.token
    });
}

/* Functions triggered by MOUSE */

function onMouseDown(e) {
    if (drawzone.hasAttribute('disabled')) { return }
    e.preventDefault();
    drawing = true;
    current.x = e.offsetX || e.touches[0].clientX - drawzone.offsetLeft;
    current.y = e.offsetY || e.touches[0].clientY - drawzone.offsetTop + window.pageYOffset;
    useTool(
        current.x,
        current.y,
        current.x,
        current.y
    );
}

function onMouseUp(e) {
    if (!drawing || drawzone.hasAttribute('disabled')) return;
    drawing = false;
}

function onMouseMove(e) {
    if (!drawing || drawzone.hasAttribute('disabled')) return;
    e.preventDefault();
    const x1 = e.offsetX || e.touches[0].clientX - drawzone.offsetLeft, 
    y1 = e.offsetY || e.touches[0].clientY - drawzone.offsetTop + window.pageYOffset;

    useTool(
        current.x, 
        current.y, 
        x1, 
        y1
    );
    current.x = x1;
    current.y = y1;
}

function onMouseWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    if(drawzone.hasAttribute('disabled')) return;
    wUp = e.wheelDelta > 0 ? true : false;
    let factor = 2;
    if (wUp) {
        if(current.size >= 46) return false;
        current.size += factor;
    } else {
        if (current.size <= 4) return false;
        current.size -= factor;
    }
    range_pen_size.value = Math.floor((current.size / (current.size > 10 ? 6 : 4)));
    drawCursor();
    return false;
}