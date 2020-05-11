
const settingszone = document.querySelector('.settingszone');
const userzone = document.querySelector('.userzone');
const drawzone = document.querySelector('.drawzone');
const chatzone = document.querySelector('.chatzone');

const userbox = document.querySelector('.userbox');

/* Join / left */
socket.emit('join_game', {id: game_id, username: localStorage.username, token: localStorage.token});
if(!localStorage.username) setTimeout(askUsername, 10000);

function askUsername(){
    if (localStorage.username) return;
    const u = prompt('Quel pseudo désirez-vous ?') || "Inconnu";
    sanitize(u, (uS) => { localStorage.username = uS });
    window.location.reload();
}

/* Game start */
socket.on('game_start', (message) => {
    
});

socket.on('user_joined', (message) => {
    console.log(message);
    createChatMessage({ console: true, content: `<span style='color: darkgreen;font-weight: bold'>(+) ${message.username}</span>`});
    createCustomElement('i',
        createCustomElement('li', userbox, { class: ['user', 'card'], content: message.username, username: message.username }), 
        {class: ['skicon-user-circle']});
});

socket.on('user_left', (message) => {
    createChatMessage({ console: true, content: `<span style='color: darkred;font-weight: bold'>(-) ${message.username}</span>` });
    document.querySelector(`li[username*='${message.username}']`).remove();
})