document.querySelector('#button_start_game').addEventListener('click', () => { socket.emit('start_game')});

socket.on('game_start', () => {
    let g = document.querySelector('.grid-game');
    for (let ch of g.children) {
        if (ch.hasAttribute('invisible')) ch.removeAttribute('invisible');
    }
    document.querySelector('.link').setAttribute('invisible', '');
    document.querySelector('.settings').setAttribute('invisible', '');
    document.querySelector('.round').textContent = 'Round 1';
    createChatMessage({ console: true, content: `<b class="blue-grey-text text-darken-3"><i class="skicon-megaphone"></i> Début de partie</b>` });
    g.classList.add('started');
    changeBoxSize();
});

socket.on('game_end', (message) => {
    let rank = message.rank;
    createChatMessage({ console: true, content: `<b class="yellow-text text-darken-3"><i class='skicon-award'></i> ${rank[0].username} a gagné avec ${rank[0].score} points !</b>` });
    let g = document.querySelector('.grid-game');
    for (let ch of g.children) {
        if (ch.classList.contains("chatzone")) continue;
        if (!ch.hasAttribute('invisible')) ch.setAttribute('invisible', '');
    }
    document.querySelector('.link').removeAttribute('invisible');
    document.querySelector('.settings').removeAttribute('invisible');
    document.querySelector('.round').textContent = '';
    document.querySelector('.hint').textContent = '';
    g.classList.remove('started');

    let rankbox = document.querySelector('.rankbox');
    rankbox.textContent = '';

    let i = 0;
    for(u of rank){
        i++;
        createCustomElement('li', rankbox, {class:["user", "card"], content: `[${i}]<br>${u.username} avec ${u.score} points`});
    }
    modal_pick.close();
    modal_rank.open();
    setTimeout(() => {
        modal_rank.close();
    }, 5000);
});

socket.on('next_round', (message) => {
    if (!message.round) return;
    createChatMessage({ console: true, content: `<b class="blue-grey-text text-darken-3 center-align"><i class="skicon-megaphone"></i> Round ${message.round}</b>` });
    document.querySelector('.round').textContent = `Round ${message.round}`;
})

socket.on('settings_changed', (message) => {
    if (message.settings) {
        document.querySelector(`.setting input[name='duration']`).value = message.settings.duration;
        document.querySelector(`.setting input[name='rounds']`).value = message.settings.rounds;
        document.querySelector(`.setting input[name='cannot_talk']`).checked = message.settings.cannot_talk == "true" ? true : false;
    }
});

const input_settings = document.querySelectorAll(".setting input");
for (let setting of input_settings) {
    setting.onchange = (e) => { changeSetting(e.srcElement) }
}

function changeSetting(e){
    if (e.hasAttribute('disabled')) return;
    let name = e.getAttribute('name');
    let value = false;
    if(e.type == "checkbox") value = e.checked;
    else value = e.value;
    socket.emit('change_setting', { setting: { name, value } });
}