const socket = io();
socket.on('user_error', showErrorMessage);

function showErrorMessage(message) {
    let html = `[${message.errorTitle}]<br>${message.errorMessage}`;
    M.toast({ html });
}