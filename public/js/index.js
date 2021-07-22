const button_create_game = document.querySelector('#button_create_game');
const button_join_game = document.querySelector('#button_join_game');

const input_username = document.querySelector('#input_username');
const input_game_id = document.querySelector('#input_game_id');

document.addEventListener('DOMContentLoaded', function () {
    var collapsibles = document.querySelectorAll('.collapsible');
    M.Collapsible.init(collapsibles);
});

input_username.value = localStorage.username || "";
input_username.focus();
input_username.onchange = input_username.onfocusout = (e) => {
    if(input_username.value == "") {
        input_username.value = localStorage.username || "";
        throttle(showErrorMessage({ errorTitle: "Nom d'utilisateur obligatoire", errorMessage: "Vous devez définir un nom d'utilisateur pour pouvoir jouer."}),3000);
    }else{
        sanitize(input_username.value, (u) => {localStorage.username = u});
    }
}

/* Create game */
button_create_game.addEventListener('click', (e) => {
    socket.emit('create_game', {
        username: localStorage.username,
        token: localStorage.token
    })
});

button_join_game.addEventListener('click', (e) => {
    if(!input_game_id.value){
        input_game_id.parentElement.style.display = 'block';
        input_game_id.focus();
    }else{
        if (input_username.value == "") {
            throttle(showErrorMessage({ errorTitle: "Nom d'utilisateur obligatoire", errorMessage: "Vous devez définir un nom d'utilisateur pour pouvoir jouer." }), 3000);
            input_username.focus();
        }else{
            socket.emit('check_game', {id: input_game_id.value});
        }
    }
});

socket.on('game_redirect', (message) =>{
    window.location = "/game/" + message.id;
});