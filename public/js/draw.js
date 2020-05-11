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
    size: 3,
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

//window.onwheel = throttle(onMouseWheel, 25);
window.onresize = changeBoxSize;

/* Set up the colors palette */

for (let i = 0; i < colors.values.length; i++) {
    let ul = createCustomElement('ul', colors.selector, {class: ["colors"]});
    for(let j = 0; j < colors.values[0].length; j++){
        let li = createCustomElement('li', ul, {class: ["color"], color: colors.values[i][j], backgroundColor: colors.values[i][j]})
    }
}

/* Palette events */

for(color of document.querySelectorAll('.color')){
    color.addEventListener('click', onColorUpdate, false);
}

for (tool of document.querySelectorAll('.tool')){
    tool.addEventListener('click', onToolUpdate, false);
}

const range_pen_size = document.querySelector('#input_pen_size');
range_pen_size.onchange = (e) => {
    current.size = parseInt(e.target.value)||2;
}

/* Socket */

socket.on('retrieveDrawing', (message) => {
    if(!message.url) return;
    console.log('retrieve');
    let i = new Image();
    i.src = message.url;
    i.onload = function () {
        context.drawImage(i, 0, 0, drawbox.width, drawbox.height);
    }
});


/* ----- */

function drawLine(x0, y0, x1, y1, color, size, tool) {

    switch (tool) {
        case TOOLS.ERASE:
            /* Don't do anything */
        break;
        
        case TOOLS.BUCKET:
        
        break;

        case TOOLS.PEN:
        default:
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
            break;
    }

    socket.emit('drawing', {
        token: localStorage.token,
        channel: game_id,
        url: drawbox.toDataURL()
    });
}

/*  ----  */

function onColorUpdate(e) {
    current.color = e.target.getAttribute('color');
}

function onToolUpdate(e){
    current.tool = TOOLS[e.target.getAttribute('tool')];
}

function changeBoxSize(){
    drawbox.width = drawbox.parentElement.offsetWidth;
    drawbox.height = drawbox.parentElement.offsetHeight;
    socket.emit('retrieveDrawing', {
        username: localStorage.username,
        token: localStorage.token,
        channel: game_id
    })
}

/* Functions triggered by MOUSE */

function onMouseDown(e) {
    if (e.target.hasAttribute('disabled')) { return }
    e.preventDefault();
    drawing = true;
    current.x = e.offsetX || e.touches[0].clientX - drawbox.offsetLeft;
    current.y = e.offsetY || e.touches[0].clientY - drawbox.offsetTop + window.scrollY;
}

function onMouseUp(e) {
    if (!drawing || !canDraw || e.target.hasAttribute('disabled')) { return; }
    onMouseMove(e);
    drawing = false;
}

function onMouseMove(e) {
    if (!drawing || !canDraw || e.target.hasAttribute('disabled')) { return; }
    e.preventDefault();
    const x1 = e.offsetX || e.touches[0].clientX - drawbox.offsetLeft, y1 = e.offsetY || e.touches[0].clientY - drawbox.offsetTop + window.scrollY;
    drawLine(
        current.x, 
        current.y, 
        x1, 
        y1, 
        current.color, 
        current.size, 
        current.tool
    );
    current.x = x1;
    current.y = y1;
}

/* Disabled */
function onMouseWheel(e) {
    wUp = e.wheelDelta > 0 ? true : false;
    if (wUp) {
        current.size += 1;
    } else {
        if (current.size == 1) return;
        current.size -= 1;
    }
}

changeBoxSize();