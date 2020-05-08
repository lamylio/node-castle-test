const chatzone = document.querySelector('.chatzone');
const chatbox = document.querySelector('.chatbox');

/* Chat */
const input_message = document.querySelector('#input_message');
input_message.addEventListener('keyup', (e) => { if (e.key == "Enter") { socket.emit('send_message', { username: localStorage.username, token: localStorage.token, content: input_message.value }); input_message.value = '' } });
socket.on('message', createChatMessage);

function createChatMessage(message) {
    let content;
    if (message.console) content = message.content;
    else content = `<b>${message.username}</b> : ${message.content}`;
    createCustomElement('li', chatbox, { content, class: ["message"] })
    chatbox.scrollTop = chatbox.scrollHeight;
}