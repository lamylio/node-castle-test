const socket = io();

socket.on('encryption', (message) => {localStorage.token = localStorage.token || message.token;})
socket.on('user_error', showErrorMessage);

function showErrorMessage(message) {
    let html = `[${message.errorTitle}]<br>${message.errorMessage}`;
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
}