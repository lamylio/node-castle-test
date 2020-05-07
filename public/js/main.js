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

async function sanitize(content){
    let d = new FormData;
    d.append("content", content);
    let f = await fetch('/sanitize', {
        method: 'POST',
        body: new URLSearchParams(d)
    });
    let t = await f.text();
    return t;
}