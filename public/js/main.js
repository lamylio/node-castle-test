const socket = io();

socket.on('disconnect', (reason) => {
    refresh = 3000;
    switch (reason) {
        case 'ping timeout':
            reason = "Votre connexion est interrompue ou trop lente.";
            refresh = 1000;
            break;
        case 'server namespace disconnect':
            reason = "Vous avez été exclu de la partie.";
            refresh = 100;
            break;
        case 'transport error':
        case 'transport close':
            reason = "Le serveur redémarre ou a planté.";
            break;
        default:
            reason = "Malheureusement la raison est inconnue..";
            break;
    }
    showErrorMessage({errorTitle: "Vous êtes déconnecté", errorMessage: "Raison : " + reason});
    setTimeout(() => {
        window.location = "/";
    }, refresh);
})

socket.emit('identity', {token: localStorage.token});
socket.on('identity', (message) => {localStorage.token = message.token;})
socket.on('username_already_taken', (message) => {localStorage.username = message.username;})
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

function dynamicallyLoadScript(url) {
    var script = document.createElement("script"); 
    script.src = url; 
    document.head.appendChild(script);
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