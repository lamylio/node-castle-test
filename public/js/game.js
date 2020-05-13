
if(!localStorage.username) setTimeout(askUsername, 5000);
socket.emit('join_game', {id: game_id, username: localStorage.username, token: localStorage.token});

const input_settings = document.querySelectorAll(".setting input");
for(let setting of input_settings){
    setting.onchange = (e) => {changeSetting(e.srcElement)}
}

/* ------------ */

dynamicallyLoadScript("/public/js/game/_status.mjs");
dynamicallyLoadScript("/public/js/game/_user.mjs");
dynamicallyLoadScript("/public/js/game/_word.mjs");

/* ------------ */

async function askUsername() {
    if (localStorage.username) return;
    const u = prompt('Quel pseudo désirez-vous ?') || "Inconnu";
    await sanitize(u, (uS) => { localStorage.username = uS });
    window.location.reload();
}