const list_users = document.querySelector('#list_users');
const chatbox = document.querySelector('.chatbox');

/* Chat */
const input_message = document.querySelector('#input_message');
input_message.addEventListener('keyup', (e) => {if(e.key == "Enter") {socket.emit('send_message', {username: localStorage.username, token: localStorage.token, content: input_message.value}); input_message.value = ''}});
socket.on('message', (message) => {
    let content;
    if(message.console) content = message.content;
    else content = `<b>${message.username}</b> : ${message.content}`;
    createCustomElement('li', chatbox, { content, class: ["message"] })
    chatbox.scrollTop = chatbox.scrollHeight;
})

/* Join / left */
socket.emit('join_game', {id: game_id, username: localStorage.username, token: localStorage.token});
if(!localStorage.username) setTimeout(askUsername, 3500);

async function askUsername(){
    if (localStorage.username) return;
    const u = prompt('Quel pseudo désirez-vous ?') || "Inconnu";
    localStorage.username = await sanitize(u);
    socket.emit('join_game', { id: game_id, username: localStorage.username, token: localStorage.token })
}
