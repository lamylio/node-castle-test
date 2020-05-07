const {io, sanitize} = require('../app.js');
const uuid = require('uuid');
//const DATE = new Date().toLocaleString();

let channels = [];

const ERROR_MESSAGES = {
    TITLES: {
        missing_username: "Nom d'utilisateur introuvable", 
        missing_token: "Token obligatoire", 
        missing_content: "Message nécessaire", 
        already_taken: "Pseudo déjà utilisé",
        wrong_identity: "Mauvaise paire pseudo/token",
        bad_game_id: "Mauvais identifiant de jeu",
        game_not_found: "Partie introuvable",
        token_already_exists: "Token déjà existant"
    },
    create_game: {
        username: "Vous devez définir un nom d'utilisateur pour créer une nouvelle partie.",
        token: "Veuillez envoyer votre token d'authentification pour créer une partie.",
    },
    join_game: {
        spectator: `Pour jouer, <a onclick='askUsername()'>cliquez ici</a>`,
        token: "Un token d'authentification est nécessaire pour rejoindre une partie.",
        format: "L'identifiant ne respecte pas le format requis.",
        not_found: "La partie demandée n'existe pas ou plus.",
        taken: "Votre pseudo est déjà utilisé par quelqu'un d'autre. Un chiffre vous a été attribué.",
        token_taken: "Le token d'authentification correspond à un joueur déjà présent."
    },
    send_message : {
        username: "Un pseudo est nécessaire pour discuter.",
        token: "Un token d'authentification est nécessaire pour discuter",
        content: "Pour envoyer un message il faut écrire un message..",
        identity: "N'essayez pas de vous faire passer pour quelqu'un d'autre."
    }
}

module.exports.getChannels = () => {
    return channels;
}

io.sockets.on('connection', (socket) => {

    /* ----- CHANNELS EVENTS ----- */

    socket.uuid = uuid.v4();
    socket.emit('encryption', { token: socket.uuid });

    socket.on('create_game', message => {
        /* Need an username to create a game */
        if (!message.username) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_username, errorMessage: ERROR_MESSAGES.create_game.username});
        else if (!message.token) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_token, errorMessage: ERROR_MESSAGES.create_game.token });
        else{
            socket.username = socket.username || sanitize(message.username, { allowedTags: [] });
            socket.uuid = sanitize(message.token, { allowedTags: [] }) || uuid.v4();
            /* Register the channel */
            let game_id = uuid.v5(socket.id, socket.uuid);
            let host = { username: socket.username, uuid: socket.uuid };
            channels.push({
                id: game_id, 
                host: host,
                users: [host],
                settings: {
                    timer: 90,
                    rounds: 3
                },
                locked: true
            });
            /* Notify the user and send the link (id) of the game */
            socket.emit('game_created', { id: game_id, token: host.uuid});
            socket.join(game_id);
        }
    });

    socket.on('join_game', message => {
        /* Need an username to join a game */
        if (!message.username){
            socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_username, errorMessage:  ERROR_MESSAGES.join_game.spectator});
        } else if (!message.token){
            socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_token, errorMessage: ERROR_MESSAGES.join_game.token});
        }else {
            socket.username = socket.username || sanitize(message.username, { allowedTags: [] });
            socket.uuid = sanitize(message.token, { allowedTags: [] }) || socket.uuid;

            /* Check the id is the right form */
            let id = sanitize(message.id, { allowedTags: [] }) || "unknown";
            if (id.length == 36) {
                /* Check if the channel with that id exists */
                let exists = channels.some(channel => channel.id == id);
                if(exists){
                    /* Catch it */
                    let channel = channels.filter(channel => channel.id == id);
                    channel = channel[0];

                    /* Unlock the channel when the host join (I could use uuid but..) */
                    if(channel.host.uuid == socket.uuid){
                        channel.locked = false;
                    }else{
                        /* If the user isn't the host then  */
                        /* Check if the username is already taken */
                        let same_username_exists = channel.users.some(user => user.username == socket.username);
                        if (same_username_exists) {
                            let same_token_exists = channel.users.some(user => user.uuid == socket.uuid);
                            if (same_token_exists) {
                                socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.token_already_exists, errorMessage: ERROR_MESSAGES.join_game.token_taken });
                                return;
                            }
                            let same_username = channel.users.filter(user => user.username == socket.username);
                            socket.username = socket.username + " (" + same_username.length + ")";
                            socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.already_taken, errorMessage: ERROR_MESSAGES.join_game.taken });
                        }

                        /* Register the joining user */
                        channel.users.push({ username: socket.username, uuid: socket.uuid});
                        socket.emit('user_joined', { username: socket.username });
                    }

                    /* Join and broadcast it in the channel */
                    socket.join(message.id);
                    socket.broadcast.in(message.id).emit('user_joined', {username: socket.username});
                    socket.channel = channel.id;

                    console.log(channel);
                }else{
                    socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.join_game.not_found});
                }
            }else{
                socket.emit('user_error', {errorTitle: ERROR_MESSAGES.TITLES.bad_game_id, errorMessage: ERROR_MESSAGES.join_game.format});
            }
        }
    });

    socket.on('disconnect', message => {
        /* If the user doesn't exists, skip */
        if (!socket.username || !socket.channel) return;
        /* As he leaves, quit all channel */
        socket.leaveAll();
        /* Remove the channel by filtering it with a custom func */
        channels = channels.filter((channel) => {
            if(channel.locked) return channel;
            else{
                /* Filter to remove the disconnected user */
                channel.users = channel.users.filter(user => user.username != socket.username);

                /* If there's no more user break here */
                if(channel.users.length == 0) return;

                /* Otherwise, if he was the host replace him by the next one */
                if (channel.host.username == socket.username) {
                    channel.host = channel.users[0];
                    socket.broadcast.in(channel.id).emit('host_changed', { username: channel.host.username });
                }
                socket.broadcast.in(channel.id).emit('user_left', {username: socket.username});
                return channel;
            }
        });
    });

    /* ----- CHAT EVENTS ----- */

    socket.on('send_message', (message) => {
        if(!socket.username || !socket.uuid || !socket.channel) return;

        if (!message.username) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_username, errorMessage: ERROR_MESSAGES.send_message.username});
        else if (!message.token) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_token, errorMessage: ERROR_MESSAGES.send_message.token});
        else if (!message.content) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_content, errorMessage: ERROR_MESSAGES.send_message.content });
        else{
            let username = sanitize(message.username, {allowedTags: []});
            let token = sanitize(message.token, { allowedTags: [] });
            let content = sanitize(message.content, {allowedTags: ['b', 'i', 'u']});

            if(socket.username == username && socket.uuid == token){
                socket.emit('message', {username, content});
                socket.broadcast.in(socket.channel).emit('message', {username, content});
            }else{
                socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.identity, errorMessage: ERROR_MESSAGES.send_message.identity });
            }
        }
    });
});