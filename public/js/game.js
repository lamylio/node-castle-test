
if(!localStorage.username) setTimeout(askUsername, 3500);
socket.emit('join_game', {id: game_id, username: localStorage.username, token: localStorage.token});

const modal_pick = M.Modal.init(document.querySelector('#pick'), { dismissible: false, startingTop: '10%', endingTop: '20%' });
const modal_reveal = M.Modal.init(document.querySelector('#reveal'), { startingTop: '10%', endingTop: '20%' });
const modal_rank = M.Modal.init(document.querySelector('#rank'), { startingTop: '10%', endingTop: '20%' });

const AUDIO = {
    USER_JOIN: { path: "user_join.mp3" },
    USER_LEFT: { path: "" },
    GAME_START: { path: "" },
    GAME_END: { path: "congrats.flac" },
    TIME_OUT_SOON: { path: "time_out_soon.mp3" },
    NEXT_ROUND: { path: "next_round.mp3" },
    WORD_FOUND: { path: "correct_answer.mp3" },
    PICK_WORD: { path: "pick_word.wav" },
    WORD_REVEAL: { path: "word_reveal.wav" },
    BACKGROUND: { path: "background.mp3" },
}
let mute = false;
for (au in AUDIO) AUDIO[au].audio = new Audio("/public/audio/" + AUDIO[au].path);

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

function switchMute(){
    mute = !mute;
    let b = document.querySelector('#mute-button')
    if(mute) {
        stopAudio(AUDIO.BACKGROUND);
        b.classList = "skicon-volume-off";
    }else b.classList = "skicon-volume-on";
}

function playAudio(audio, loop = false, volume = 1) {
    if (mute) return;
    let a = audio.audio;
    a.loop = loop;
    a.volume = volume;
    a.play();
}

function stopAudio(audio) {
    audio.audio.pause();
}
