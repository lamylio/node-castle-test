const { io, sanitize } = require('../app.js');
const uuid = require('uuid');
//const DATE = new Date().toLocaleString();

module.exports.ERROR_MESSAGES = {
    TITLES: {
        missing_username: "Nom d'utilisateur nécessaire",
        missing_token: "Token nécessaire",
        missing_content: "Message nécessaire",
        missing_draw: "ImageURL nécessaire",

        username_already_taken: "Pseudo déjà utilisé",
        token_already_exists: "Token déjà existant",

        wrong_identity: "Identité invalide",
        wrong_format: "Mauvais format",

        game_not_found: "Partie introuvable",
        game_not_started: "Partie en attente",
        not_enough_players: "Pas assez de joueurs",
    },
    BODY: {
        missing_username: "Vous devez définir un nom d'utilisateur.",
        missing_token: "Un token d'authentification est nécessaire.",
        missing_content: "Pour envoyer un message il faut écrire un message..",
        missing_draw: "Vous devez fournir l'URL de la drawbox pour les autres joueurs.",

        username_already_taken: "Votre pseudo est déjà utilisé par quelqu'un d'autre.<br> <small>Un nom aléatoire vous a été attribué. </small>",
        token_already_exists: "Le token d'authentification correspond à un joueur déjà présent.",

        wrong_identity: "Votre identité n'a pas pu être vérifiée. <br>En cas de problème, supprimez vos cookies. <br> <small>(N'essayez pas de vous faire passer pour quelqu'un d'autre.)</small>",
        wrong_format: "Le format reçu ne correspond pas au format requis.",

        game_not_found: "La partie demandée n'existe pas ou plus.",
        game_not_started: "La partie n'a pas encore commencé.<br> Aucun dessin à récupérer.",

        not_the_host: "Vous n'êtes pas l'hôte de la partie.",
        not_the_drawer: "Vous n'êtes pas le dessinateur.<br> Attendez votre tour.",
        not_enough_players: "Vous devez être au minimum 2 joueurs."
    }
}

let channels = [];
module.exports.getChannels = () => {
    return channels;
}

io.sockets.on('connection', (socket) => {

    socket.on('identity', (message) => {
        
        if(message.token){
            let token = sanitize(message.token, { allowedTags: [] });
            if (token.length == 20) {
                socket.uuid = token;
            }
        }
        
        if(!socket.uuid){
            socket.uuid = socket.id;
            socket.emit('identity', { token: socket.uuid });
        }
        
    }) 

    require('./io/_game.js')(socket, this.getChannels(), this.ERROR_MESSAGES);
    require('./io/_chat.js')(socket, this.getChannels(), this.ERROR_MESSAGES);
    require('./io/_draw.js')(socket, this.getChannels(), this.ERROR_MESSAGES);

});