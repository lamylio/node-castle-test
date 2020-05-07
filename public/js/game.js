const list_users = document.querySelector('#list_users');


socket.emit('join_game', {id: game_id, username: localStorage.username, token: localStorage.token});

socket.on('user_joined', (message) => {
    console.log(message);
    createCustomElement('li', list_users, {content: message.username});
});
