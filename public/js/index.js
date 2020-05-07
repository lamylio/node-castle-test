const button_create_game = document.querySelector('#button_create_game');
const button_join_game = document.querySelector('#button_join_game');

const input_username = document.querySelector('#input_username');
const input_game_id = document.querySelector('#input_game_id');


input_username.value = localStorage.username || "";
input_username.focus();

input_username.onchange = input_username.onfocusout = async (e) => {
    if(input_username.value == "") {
        input_username.value = localStorage.username || "";
        showErrorMessage({errorTitle: "Nom d'utilisateur obligatoire", errorMessage: "Veuillez définir un nom d'utilisateur avant de vouloir jouer"});
        return;
    }
    let d = new FormData;
    d.append("username", input_username.value);
    let f = await fetch('/sanitize', {
        method: 'POST',
        body: new URLSearchParams(d)
    });
    localStorage.username = await f.text();
}

button_create_game.addEventListener('click', (e) => {
    if (localStorage.username){
        socket.emit('create_game', {
            username: input_username.value,
            token: localStorage.token
        })
    }else{
        showErrorMessage({ 
            errorTitle: "Nom d'utilisateur introuvable", 
            errorMessage: "Veuillez définir un nom d'utilisateur avant de vouloir jouer" 
        });
    }
});

button_join_game.addEventListener('click', (e) => {
    if(!input_game_id.value){
        input_game_id.parentElement.style.display = 'block';
        input_game_id.focus();
    }else{
        window.location += "game/" + input_game_id.value;
    }
});

socket.on('game_created', (message) => {
    window.location+= ("game/" + message.id);
})