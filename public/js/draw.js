/* Largement inspiré de la démo de socket.io (lol) */

const drawbox = document.querySelector('.drawbox');
const drawzone= document.querySelector('.drawzone');

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

const TOOLS = {
    PEN: 0,
    BUCKET: 1
}

let drawing = false;
let bucket = false;
let current = {
    color: '#111000',
    size: 3,
    tool: TOOLS.PEN
};

/* Register events */

drawzone.addEventListener('mousedown', onMouseDown, false);
drawzone.addEventListener('mouseup', onMouseUp, false);
drawzone.addEventListener('mouseout', onMouseUp, false);
drawzone.addEventListener('mousemove', throttle(onMouseMove, 20), false);

drawzone.addEventListener('touchstart', onMouseDown, false);
drawzone.addEventListener('touchend', onMouseUp, false);
drawzone.addEventListener('touchcancel', onMouseUp, false);
drawzone.addEventListener('touchmove', throttle(onMouseMove, 10), false);

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

for(color of document.querySelectorAll('.colors')){
    color.addEventListener('click', onColorUpdate);
}

const range_pen_size = document.querySelector('#input_pen_size');
range_pen_size.onchange = (e) => {
    current.size = parseInt(e.target.value)*4||8;
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

    switch (current.tool) {      
        case TOOLS.BUCKET:
            if(bucket) return;
            console.log("Bucket started");
            const factor = 2;
            current.layer = context.getImageData(0,0, drawbox.width, drawbox.height);

            let startPos = (y1 * drawbox.width + x1) * 4;
            let startColor = [current.layer.data[startPos], current.layer.data[startPos + 1], current.layer.data[startPos + 2]];
            let newColor = hexToRGB(current.color.slice(1));
            if(startColor == newColor) return; /* Same color */
            bucket = true;
            let stack = [[x1, y1]];
        
            while(stack.length){
                let pos = stack.pop();
                let x = pos[0];
                let y = pos[1];

                let pixel = (y * drawbox.width + x) * 4;
                /* We're slowly going upward until we hit the border of a color that doesnt match */
                while (matchColor(pixel, startColor) && y >= 0){
                    y -= factor;
                    pixel -= drawbox.width * 4 * factor;
                }
                /* Going down now */
                colorPixel(pixel, startColor);

                let left = false, right = false;
                while(matchColor(pixel, startColor) && y < drawbox.height-1){
                    if (drawzone.hasAttribute('disabled')) { return }
                    y += factor;
                    colorPixel(pixel, newColor);
                    context.beginPath();
                    context.arc(x, y, current.size / 2 + 0.05, 0, 2 * Math.PI);
                    //context.rect(x, y, factor-1, factor-1);
                    context.fill();
                    context.closePath();
                    
                    //await timeout(0);
                    /* Look left first */
                    if(x > 0){
                        /* Push the column to the stack */
                        if (matchColor(pixel - (4), startColor)){
                            if(!left){
                                stack.push([x - 1, y]);
                                left = true;
                            }
                        }else if(left) left = false;
                        /* If we hit a not-match, reset left check */
                    }

                    /* Look right then */
                    if(x < drawbox.width-1){
                        if (matchColor(pixel + (4), startColor)){
                            if(!right){
                                stack.push([x + 1, y]);
                                right = true;
                            }
                        }else if(right) right = false;
                    }

                    pixel += drawbox.width * 4 * factor;
                }
            }
            //context.putImageData(current.layer, 0, 0);
            bucket = false;
            console.log("Bucket done");
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
        url: drawbox.toDataURL()
    });
}

/*  ----  */

function resetDrawbox(){
    socket.emit('clean_drawing');
}

function onColorUpdate(e) {
    current.color = e.srcElement.getAttribute('color');
}

function onToolUpdate(e){
    let attr = e.getAttribute('tool');
    console.log(attr);
    current.tool = TOOLS[attr];
    console.log(current.tool);
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

async function colorPixel(pixel, newColor){
    current.layer.data[pixel] = newColor[0];
    current.layer.data[pixel + 1] = newColor[1];
    current.layer.data[pixel + 2] = newColor[2];
    current.layer.data[pixel + 3] = 255;
}

async function matchColor(pixel, startColor){
    var r = current.layer.data[pixel];
    var g = current.layer.data[pixel + 1];
    var b = current.layer.data[pixel + 2];
    return (r == startColor[0] && g == startColor[1] && b == startColor[2]);
}

function hexToRGB(hex) {return [(bigint = parseInt(hex, 16)) >> 16 & 255, bigint >> 8 & 255, bigint & 255];}