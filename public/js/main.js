const socket = io();

const modal_pick = M.Modal.init(document.querySelector('#pick'), { dismissible: false, startingTop: '10%', endingTop: '20%'});
const modal_reveal = M.Modal.init(document.querySelector('#reveal'), { startingTop: '10%', endingTop: '20%' });
const modal_rank = M.Modal.init(document.querySelector('#rank'), { startingTop: '10%', endingTop: '20%' });

const AUDIO = {
    USER_JOIN: {path: "user_join.mp3"},
    GAME_START: {path: ""},
    GAME_END: {path: "congrats.flac"},
    NEXT_ROUND: {path: "next_round.mp3"},
    WORD_FOUND: {path: "correct_answer.mp3"},
    PICK_WORD: {path: "pick_word.wav"},
    WORD_REVEAL: {path: "word_reveal.wav"},
    BACKGROUND: {path: "background.mp3"},
}

socket.on('disconnect', (reason) => {
    switch (reason) {
        case 'ping timeout':
            reason = "Votre connexion est interrompue ou trop lente.";
            break;
        case 'server namespace disconnect':
            reason = "Vous avez été exclu de la partie.";
            break;
        case 'transport error':
        case 'transport close':
            reason = "Le serveur redémarre ou a planté.";
            break;
        default:
            reason = "Malheureusement la raison est inconnue..";
            break;
    }
    showErrorMessage({errorTitle: "Vous êtes déconnecté", errorMessage: "Raison : " + reason});
})

socket.emit('identity', {token: localStorage.token});
socket.on('identity', (message) => {localStorage.token = message.token;})
socket.on('username_already_taken', (message) => {localStorage.username = message.username;})
socket.on('user_error', showErrorMessage);

function showErrorMessage(message) {
    let html = `<div class="toast-title">${message.errorTitle}</div><br><div class="toast-content">${message.errorMessage}</div>`;
    M.toast({ html });
}

function createCustomElement(type, parent, attributes) {
    let e = document.createElement(type);

    for (attr in attributes) {
        switch (attr) {
            case 'content':
                e.innerHTML = attributes.content;
                break;
            case 'backgroundColor':
                e.style.backgroundColor = attributes.backgroundColor;
                break;
            case 'class':
                for (let i = 0; i < attributes[attr].length; i++)
                    e.classList.add(attributes[attr][i]);
                break;
            default:
                e.setAttribute(attr, attributes[attr]);
                break;
        }
    }
    parent.appendChild(e);
    return e;
}

async function sanitize(content, callback){
    let d = new FormData;
    d.append("content", content);
    let f = await fetch('/sanitize', {
        method: 'POST',
        body: new URLSearchParams(d)
    });
    let r = await f.text() || "Inconnu";
    callback(r);
    return r;
}

function dynamicallyLoadScript(url) {
    var script = document.createElement("script"); 
    script.src = url; 
    document.head.appendChild(script);
}


for (au in AUDIO) {
    AUDIO[au].audio = new Audio("/public/audio/" + AUDIO[au].path);
}

function playAudio(audio, loop = false, volume = 1){
    let a = audio.audio;
    a.loop = loop;
    a.volume = volume;
    a.play();
}

function stopAudio(audio){
    audio.audio.pause();
}

function timeout(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function () {
        var time = new Date().getTime();

        if ((time - previousCall) >= delay) {
            previousCall = time;
            callback.apply(null, arguments);
        }
    };
}