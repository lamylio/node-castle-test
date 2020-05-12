
/* Zones */
const settings = document.querySelector('.settings');


socket.emit('join_game', {id: game_id, username: localStorage.username, token: localStorage.token});
if(!localStorage.username) setTimeout(askUsername, 5000);

/* ----- Game Init ----- */

socket.on('game_start', () => {
    let g = document.querySelector('.grid-game');
    for(let ch of g.children){
        if(ch.hasAttribute('invisible')) ch.removeAttribute('invisible');
    }
    settings.setAttribute('invisible', '');
    g.classList.add('started');
    changeBoxSize();
});

socket.on('game_end', () => {
    alert('TODO: GAME END');
});

document.querySelector('#button_start_game').onclick = () => {
    socket.emit('start_game', {
        token: localStorage.token
    });
}

/* Users related listeners */

socket.on('host_changed', (message) => {
    /* Pas la peine d'essayer de gruger, il y a des vérifications côté serveur ;) */
    //createChatMessage({ console: true, content: `<span style='color: darkorange;font-weight: bold'><i class='skicon-star'></i> ${message.username} devient l'hôte</span>` });
    if(localStorage.username != message.username) return;
    for(let s of document.querySelectorAll('.setting')){
        for(let e of s.children){
            e.removeAttribute('disabled');
        }
    }
    document.querySelector("#button_start_game").removeAttribute('disabled');
});

socket.on('drawer_changed', (message) => {
    for(let u of document.querySelectorAll('.user')) u.style.color = 'initial';

    if(message.username == localStorage.username) drawbox.removeAttribute('disabled');
    else drawbox.setAttribute('disabled', '');

    document.querySelector(`.user[username=${message.username}]`).style.color = 'blue';
    createChatMessage({ console: true, content: `<span style='color: blue;font-weight: bold'><i class='skicon-pencil'></i> ${message.username} est dessinateur</span>` });
})

socket.on('user_joined', (message) =>{
    createChatMessage({ console: true, content: `<span style='color: darkgreen;font-weight: bold'><i class='skicon-plus-squared'></i> ${message.username}</span>` });
    addUserToList(message.username);
});

socket.on('user_list', (message) => {
    document.querySelector('.userbox').textContent = '';
    for(user of message.users){
        addUserToList(user.username);
    }
})
socket.on('user_left', (message) => {
    createChatMessage({ console: true, content: `<span style='color: darkred;font-weight: bold'><i class='skicon-minus-squared'></i> ${message.username}</span>` });
    document.querySelector(`li[username*='${message.username}']`).remove();
})

/* ----- Others Game related ----- */

socket.on('pick_word', (message) => {
    console.table(message.words);
})

socket.on('reveal_word', (message) => {
    /* TODO message.word */
});















/* ------------ */

function addUserToList(username){
    createCustomElement('i',
        createCustomElement('li', document.querySelector('.userbox'), { class: ['user', 'card'], content: username, username: username }),
        { class: ['skicon-user-circle'] });
}

async function askUsername() {
    if (localStorage.username) return;
    const u = prompt('Quel pseudo désirez-vous ?') || "Inconnu";
    await sanitize(u, (uS) => { localStorage.username = uS });
    window.location.reload();
}