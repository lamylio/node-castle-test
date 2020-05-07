const button_create_game = document.querySelector('#button_create_game');
const input_username = document.querySelector('#input_username');

input_username.onchange = async (e) => {
    let d = new FormData;
    d.append("username", input_username.value);
    let f = await fetch('/sanitize', {
        method: 'POST',
        body: new URLSearchParams(d)
    });
    localStorage.username = await f.text();
}

button_create_game.addEventListener('click', (e) => {
    if(input_username.value.length > 1){
        socket.emit('create_game', {
            username: input_username.value
        })
    }else{
        showErrorMessage({ 
            errorTitle: "Nom d'utilisateur introuvable", 
            errorMessage: "Veuillez définir un nom d'utilisateur avant de vouloir jouer" 
        });
    }
});

socket.on('game_created', (message) => {
    
    window.location+= ("game/" + message.id);
})





function createCustomElement(type, parent, attributes) {
    let e = document.createElement(type);

    for (attr in attributes) {
        switch (attr) {
            case 'content':
                e.innerHTML = attributes.content;
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
}