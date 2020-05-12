const button_create_game = document.querySelector('#button_create_game');
const button_join_game = document.querySelector('#button_join_game');

const input_username = document.querySelector('#input_username');
const input_game_id = document.querySelector('#input_game_id');

input_username.value = localStorage.username;
input_username.focus();

input_username.onchange = input_username.onfocusout = (e) => {
    if(input_username.value == "") {
        input_username.value = localStorage.username;
        throttle(showErrorMessage({ errorTitle: "Nom d'utilisateur obligatoire", errorMessage: "Vous devez définir un nom d'utilisateur pour pouvoir jouer."}),3000);
    }else{
        sanitize(input_username.value, (u) => {localStorage.username = u});
    }
}

/* Create game */
button_create_game.addEventListener('click', (e) => {
    if (localStorage.username){
        socket.emit('create_game', {
            username: localStorage.username,
            token: localStorage.token
        })
    }else throttle(showErrorMessage({ errorTitle: "Nom d'utilisateur introuvable", errorMessage: "Vous devez définir un nom d'utilisateur pour créer une nouvelle partie."}), 3000);
});

button_join_game.addEventListener('click', (e) => {
    if(!input_game_id.value){
        input_game_id.parentElement.style.display = 'block';
        input_game_id.focus();
    }else{
        if(input_game_id.value.length == 36){
            socket.emit('check_game', {id: input_game_id.value});
        }
        else throttle(showErrorMessage({errorTitle: "Mauvais identifiant de jeu", errorMessage: "L'identifiant ne respecte pas le format requis."}),3000);
    }
});

socket.on('game_redirect', (message) =>{
    window.location += "game/" + message.id;
});