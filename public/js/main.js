const socket = io();

socket.on('encryption', (message) => {localStorage.token = localStorage.token || message.token;})
socket.on('user_error', showErrorMessage);

function showErrorMessage(message) {
    let html = `<div class="toast-title">${message.errorTitle}</div><br><div class="toast-content">${message.errorMessage}</div>`;
    M.toast({ html });
}

function createCustomElement(type, parent, attributes) {
    let e = document.createElement(type);

    for (attr in attributes) {
        switch (attr) {
            case 'content':
                e.innerHTML = attributes.content;
                break;
            case 'backgroundColor':
                e.style.backgroundColor = attributes.backgroundColor;
                break;
            case 'class':
                for (let i = 0; i < attributes[attr].length; i++)
                    e.classList.add(attributes[attr][i]);
                break;
            default:
                e.setAttribute(attr, attributes[attr]);
                break;
        }
    }
    parent.appendChild(e);
    return e;
}

async function sanitize(content, callback){
    let d = new FormData;
    d.append("content", content);
    let f = await fetch('/sanitize', {
        method: 'POST',
        body: new URLSearchParams(d)
    });
    let r = await f.text() || "Inconnu";
    callback(r);
    return r;
}

function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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