const { io, sanitize, manulex } = require('../app.js');

module.exports.ERROR_MESSAGES = {
    TITLES: {
        missing_username: "Nom d'utilisateur nécessaire",
        missing_content: "Message nécessaire",
        missing_draw: "ImageURL nécessaire",
        missing_setting: "Paramètre nécessaire",
        missing_word: "Mot nécessaire",

        username_already_taken: "Pseudo déjà utilisé",
        token_already_exists: "Token déjà existant",

        wrong_identity: "Identité invalide",
        wrong_format: "Mauvais format",
        wrong_word: "Mauvais mot",

        game_not_found: "Partie introuvable",
        game_not_started: "Partie en attente",
        not_enough_players: "Pas assez de joueurs",

        cannot_talk: "Messages interdits",
    },
    BODY: {
        missing_username: "Vous devez définir un nom d'utilisateur.",
        missing_content: "Pour envoyer un message il faut écrire un message..",
        missing_draw: "Vous devez fournir l'URL de la drawbox pour les autres joueurs.",
        missing_setting: "Pour changer les paramètres vous devez fournir le paramètre.",
        missing_word: "Vous devez sélectionner un mot",

        username_already_taken: "Votre pseudo est déjà utilisé par quelqu'un d'autre.<br> <small>Un nom aléatoire vous a été attribué. </small>",
        token_already_exists: "Le token d'authentification correspond à un joueur déjà présent.",

        wrong_identity: "Votre identité n'a pas pu être vérifiée.<br> Un nouveau token vous a été assigné.",
        wrong_format: "Le format reçu ne correspond pas au format requis.",
        wrong_word: "Le mot reçu ne fait pas partie de la sélection.",

        game_not_found: "La partie demandée n'existe pas ou plus.",
        game_not_started: "La partie n'a pas encore commencé.<br> Aucun dessin à récupérer.",

        not_the_host: "Vous n'êtes pas l'hôte de la partie.",
        not_the_drawer: "Vous n'êtes pas le dessinateur.<br> Attendez votre tour.",
        not_enough_players: "Vous devez être au minimum 2 joueurs.",

       cannot_talk: "Vous ne pouvez pas parler pour l'instant.",
    }
}

let channels = [], timers = [];

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

    require('./io/_game.js')(socket, getChannels(), this.ERROR_MESSAGES);
    require('./io/_chat.js')(socket, getChannels(), this.ERROR_MESSAGES);
    require('./io/_draw.js')(socket, getChannels(), this.ERROR_MESSAGES);

});

/* ---- */

function getChannels() {return channels;}
function getTimers(){ return timers;}

/* So basically the user can only be host of 1 channel at a time 
(coz I use '.find' which returns the first occurence) */

function isHost (socket) {

    /* Check if current user channel does exists */
    let channel = channels.find(channel => channel.id == socket.channel);
    if (channel) {
        /* Host check */
        if (channel.host.uuid == socket.uuid) {
            return true;
        } else socket.emit('user_error', { errorTitle: this.ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: this.ERROR_MESSAGES.BODY.not_the_host });

    } else socket.emit('user_error', { errorTitle: this.ERROR_MESSAGES.TITLES.game_not_found, errorMessage: this.ERROR_MESSAGES.BODY.game_not_found });
    return false;
}

function nextDrawer(socket, channel) {
    if(channel.game.words.picked != ""){
        socket.emit('reveal_word', { word: channel.game.words.picked });
        socket.to(channel.id).emit('reveal_word', { word: channel.game.words.picked });
    }
    
    /* Reset the round propreties */
    channel.game.drawURL = "";
    channel.game.words.picked = "";
    channel.game.words.proposed = [];
    channel.game.words.found = [];
    channel.game.timer = 0;

    let next_drawer = channel.users.find(
        user => user.hasDrawn == false 
        && user.uuid != channel.game.drawer.uuid
    );

    if (!next_drawer) {
        /* Reset the user hasDrawn property */
        channel.users.map(user => { user.hasDrawn = false });
        if (channel.game.round < channel.settings.rounds) {
            next_drawer = channel.users[0];
            channel.game.round++;
            socket.emit('next_round', { round: channel.game.round });
            socket.to(channel.id).emit('next_round', { round: channel.game.round });
        } else {
            /* TODO - END THE GAME */
        
            let ordered = channel.users.sort((a, b) => b.score - a.score);
            let rank = [];
            for(u of ordered){
                rank.push({username: u.username, score: u.score});
            }

            console.log(rank);
            socket.emit('game_end', { rank });
            socket.to(channel.id).emit('game_end', { rank });

            channel.game.started = false;
            channel.game.drawer = "";
            channel.game.round = 0;
            channel.users.map(user => { user.score = 0 });
            return;
        }
    }
    channel.game.words.proposed = [
        manulex[Math.floor(Math.random() * manulex.length)],
        manulex[Math.floor(Math.random() * manulex.length)],
        manulex[Math.floor(Math.random() * manulex.length)]
    ];

    next_drawer.hasDrawn = true;
    channel.game.drawer = next_drawer;

    socket.emit('drawer_changed', { username: next_drawer.username });
    socket.to(channel.id).emit('drawer_changed', { username: next_drawer.username });

    socket.emit('clean_drawing');
    socket.to(channel.id).emit('clean_drawing');

    if(socket.uuid == next_drawer.uuid) socket.emit('pick_word', { words: channel.game.words.proposed });
    else socket.broadcast.to(next_drawer.uuid).emit('pick_word', { words: channel.game.words.proposed });

    let d = new Date();
    /* 5 seconds more bc lag */
    d = new Date(d.getTime() + (1000 * (5 + parseInt(channel.settings.duration))));
    channel.game.expires = d;
}

module.exports = { getChannels, getTimers, nextDrawer: nextDrawer, isHost }