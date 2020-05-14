
socket.on('user_joined', (message) => {
    createChatMessage({ console: true, content: `<b class="green-text text-darken-3"><i class='skicon-plus-squared'></i> ${message.username} a rejoint.</b>` });
    addUserToList(message.username);
});

socket.on('user_left', (message) => {
    createChatMessage({ console: true, content: `<b class="red-text text-darken-3"><i class='skicon-minus-squared'></i> ${message.username} a quitté.</b>` });
    document.querySelector(`li[username*='${message.username}']`).remove();
})

socket.on('user_list', (message) => {
    document.querySelector('.userbox').textContent = '';
    for (user of message.users) {
        addUserToList(user.username);
    }
})

/* Game-users related listeners */

socket.on('host_changed', (message) => {
    /* Pas la peine d'essayer de gruger, il y a des vérifications côté serveur ;) */
    //createChatMessage({ console: true, content: `<span style='color: darkorange;font-weight: bold'><i class='skicon-star'></i> ${message.username} devient l'hôte</span>` });
    if (localStorage.username != message.username) return;
    for (let s of document.querySelectorAll('.setting')) {
        for (let e of s.children) {
            e.removeAttribute('disabled');
        }
    }
    document.querySelector("#button_start_game").removeAttribute('disabled');
});

socket.on('drawer_changed', (message) => {
    for (let u of document.querySelectorAll('.user')) u.classList.remove('blue-text', 'text-darken-3');
    drawzone.setAttribute('disabled', '');

    document.querySelector(`.user[username=${message.username}]`).classList.add('blue-text', 'text-darken-3');
    createChatMessage({ console: true, content: `<b class="blue-text text-darken-3"><i class='skicon-pencil'></i> ${message.username} dessine.</b>` });
});

/* --- */

function addUserToList(username) {
    createCustomElement('i',
        createCustomElement('li', document.querySelector('.userbox'), { class: ['user', 'card'], content: username, username: username }),
        { class: ['skicon-user-circle'] });
}