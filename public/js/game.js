const list_users = document.querySelector('#list_users');

const drawzone = document.querySelector('.drawzone');
const settingszone = document.querySelector('.settingszone');

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
    chatzone.classList.remove('offset-l1');
    settingszone.style.display = "none";
    drawzone.style.display = "block";
});