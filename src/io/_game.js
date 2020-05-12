const { sanitize, manulex } = require('../../app.js');
const uuid = require('uuid');

const manulex_size = manulex.noms_communs.length;

/* ----- CHANNELS EVENTS ----- */
module.exports = function (socket, channels, ERROR_MESSAGES) {

    socket.on('create_game', message => {
        if(!socket.uuid) return;
        /* Need an username and a token to create a game */
        if (!message.username) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_username, errorMessage: ERROR_MESSAGES.BODY.missing_username });
        else if (!message.token) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_token, errorMessage: ERROR_MESSAGES.BODY.missing_token });
        else {
            
            socket.username = socket.username || sanitize(message.username, { allowedTags: [] });
            let token = sanitize(message.token, { allowedTags: [] });
            
            if(socket.uuid == token){
                /* Register the channel */
                let game_id = uuid.v4();
                let host = { username: socket.username, uuid: socket.uuid, points: 0, hasDrawn: false};
                /* Push the channel object to the list */
                channels.push({
                    index: channels.length,
                    id: game_id,
                    host: host,
                    users: [],
                    settings: {
                        time: 90,
                        rounds: 3
                    },
                    game: {
                        started: false,
                        round: 0,
                        drawer: "",
                        drawURL: "",
                        words: {
                            picked: "",
                            proposed: []
                        },
                        timer: undefined,
                    },
                    locked: true
                });
                /* Notify the user and send the link (id) of the game */
                socket.join(game_id);
                socket.emit('game_redirect', { id: game_id });   
            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.wrong_identity });
            
        }
    });

    socket.on('join_game', message => {
        if(!socket.uuid) return;
        /* Need an username and a token to join a game */
        if (!message.username) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_username, errorMessage: ERROR_MESSAGES.BODY.missing_username });
        else if (!message.token) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_token, errorMessage: ERROR_MESSAGES.BODY.missing_token });
        else {
            
            socket.username = socket.username || sanitize(message.username, { allowedTags: [] });
            let token = sanitize(message.token, { allowedTags: [] });

            if(socket.uuid == token){
                
                /* Check the id is the right form */
                let id = sanitize(message.id, { allowedTags: [] });
                if (id.length == 36) {
                    /* Check if the channel with that id exists */
                    let channel = channels.find(channel => channel.id == id);
                    if (channel) {
                        /* Check if the username is already taken */
                        if (channel.users.some(user => user.username == socket.username)) {
                            /* Check if the token is already used */
                            if (channel.users.some(user => user.uuid == socket.uuid)) {
                                socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.token_already_exists, errorMessage: ERROR_MESSAGES.BODY.token_already_exists });
                                return;
                            }
                            socket.username = manulex.noms_communs[Math.floor(Math.random() * manulex_size)];
                            socket.emit('username_already_taken', {username: socket.username});
                            socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.username_already_taken, errorMessage: ERROR_MESSAGES.BODY.username_already_taken });
                        }

                        /* Register the joining user */
                        channel.users.push({ username: socket.username, uuid: socket.uuid, points: 0 });
                        socket.channel = channel.id;

                        /* Join, get users and broadcast it in the channel */
                        socket.join(socket.uuid);
                        socket.join(socket.channel);

                        socket.emit('user_list', { 
                            users: channel.users.filter(user => {if(user.username != socket.username) return user.username})
                        });
                        socket.emit('user_joined', { username: socket.username });
                        socket.to(socket.channel).emit('user_joined', { username: socket.username });

                        /* Unlock the channel when the host join */
                        if (channel.host.uuid == socket.uuid) {
                            channel.locked = false;
                            socket.emit('host_changed', { username: socket.username });
                        }

                        /* Retrieve the drawer/drawing if game already started */
                        if (channel.game.started){
                            socket.emit('game_start');
                            socket.emit('drawer_changed', { username: channel.game.drawer.username })
                            socket.emit('retrieve_drawing', { url: channel.game.drawURL });
                        }

                    } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });
                } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_format, errorMessage: ERROR_MESSAGES.BODY.wrong_format });
            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.wrong_identity });
        }
    });

    socket.on('disconnect', () => {
        /* If the user doesn't exists, skip */
        if (!socket.uuid || !socket.channel || !socket.username) return;
        /* As he leaves, quit all the channels */
        socket.leaveAll();

        let channel = channels.find(channel => channel.id == socket.channel);
        if(channel){
            if (channel.locked) return;

            /* Filter to remove the disconnected user (so user can only be in 1 game at a time) */
            channel.users = channel.users.filter(user => user.uuid != socket.uuid);

            /* If there's no more user deletes the channel */
            if (channel.users.length == 0) {
                channels.splice(channel.index, 1);
                return;
            }

            /* Otherwise continue */
            socket.to(channel.id).emit('user_left', { username: socket.username });

            /* If he was the host replace him by the next one */
            if (channel.host.username == socket.username) {
                channel.host = channel.users[0];
                socket.to(channel.id).emit('host_changed', { username: channel.host.username });
            }
            
            nextRound(socket, channel);
        }
    });

    /* Users triggered functions */

    socket.on('check_game', (message) => {
        if (!message.id) return;
        let id = sanitize(message.id, { allowedTags: [] });
        /* Channel id format check */
        if (id.length == 36) {
            /* Check if the channel with that id exists */
            if (channels.some(channel => channel.id == id)) {
                socket.emit('game_redirect', { id });
            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });
            
        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_format, errorMessage: ERROR_MESSAGES.BODY.wrong_format });
        
    });


    socket.on('start_game', (message) => {
        if(!socket.uuid || !socket.channel) return;
        /* Need a token to start a game */
        if (message.token) {
            let token = sanitize(message.token, { allowedTags: [] });
            /* Idendity check */
            if(socket.uuid == token){
                /* Check if current user channel does exists */
                let channel = channels.find(channel => channel.id == socket.channel);
                if (channel){
                    /* Host check */
                    if (channel.host.uuid == socket.uuid){
                        if(channel.users.length > 1){

                            channel.game.started = true;
                            socket.emit('game_start');
                            socket.to(socket.channel).emit('game_start');
                            
                            /* TODO - START THE GAME */

                            nextRound(socket, channel);

                        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.not_enough_players, errorMessage: ERROR_MESSAGES.BODY.not_enough_players });
                    }else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.not_the_host });
                    
                }else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });
            }else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.wrong_identity });
        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_token, errorMessage: ERROR_MESSAGES.BODY.missing_token });
    
    });

    function nextRound(socket, channel) {
        clearTimeout(channel.game.timer);
        channel.game.drawURL = "";
        let next_drawer = channel.users.find(user => user.hasDrawn == false);
        if (!next_drawer) {
            /* Reset the user hasDrawn property */
            channel.users.map(user => { user.hasDrawn = false });
            /* If there's not user left who hasnt drawn, start the next round */
            if (channel.game.round < channel.settings.rounds) {
                channel.game.round++;
                next_drawer = channel.users[0];
            } else {
                /* TODO - END THE GAME */
                channel.game.drawer = "";
                socket.emit('game_end', { winner: "WIP" });
                socket.to(channel.id).emit('game_end', { winner: "WIP" });
                return;
            }
        }
        channel.game.words.proposed = [
            manulex.noms_communs[Math.floor(Math.random() * manulex_size)],
            manulex.noms_communs[Math.floor(Math.random() * manulex_size)],
            manulex.noms_communs[Math.floor(Math.random() * manulex_size)]
        ];

        next_drawer.hasDrawn = true;
        channel.game.drawer = next_drawer;

        socket.emit('drawer_changed', { username: next_drawer.username });
        socket.to(channel.id).emit('drawer_changed', { username: next_drawer.username });

        socket.emit('clean_drawing');
        socket.to(channel.id).emit('clean_drawing');

        if(next_drawer.uuid == socket.uuid)
        socket.emit('pick_word', { words: channel.game.words.proposed });
        socket.broadcast.to(next_drawer.uuid).emit('pick_word', { words: channel.game.words.proposed });
        
        channel.game.timer = setTimeout(nextRound, 1000 * channel.settings.time, socket, channel);
    }
}

