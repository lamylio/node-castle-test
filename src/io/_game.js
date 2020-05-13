const { sanitize, manulex, manulex_size } = require('../../app.js');
const { nextDrawer, getTimers, isHost } = require('../socket.js');
const uuid = require('uuid');

/* ----- CHANNELS EVENTS ----- */
module.exports = function (socket, channels, ERROR_MESSAGES) {

    socket.on('create_game', message => {
        if(!socket.uuid) return;
        /* Need an username to create a game */
        if (!message.username) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_username, errorMessage: ERROR_MESSAGES.BODY.missing_username });
        else {
            
            socket.username = socket.username || sanitize(message.username, { allowedTags: [] });
            
            /* Register the channel */
            let game_id = uuid.v4();
            let host = { username: socket.username, uuid: socket.uuid, points: 0, hasDrawn: false};
            /* Push the channel object to the list */
            channels.push({
                index: channels.length,
                id: game_id,
                host: {username: host.username, uuid: host.uuid},
                users: [],
                settings: {
                    duration: 90,
                    rounds: 3
                },
                game: {
                    started: false,
                    round: 0,
                    drawer: "",
                    drawURL: "",
                    words: {
                        hint: "",
                        picked: "",
                        proposed: [],
                        found: [],
                    },
                    expires: 0,
                },
                locked: true
            });
            /* Notify the user and send the link (id) of the game */
            socket.join(game_id);
            socket.emit('game_redirect', { id: game_id });              
        }
    });

    socket.on('join_game', message => {
        if(!socket.uuid) return;
        /* Need an username to join a game */
        if (!message.username) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_username, errorMessage: ERROR_MESSAGES.BODY.missing_username });
        else {
            
            socket.username = socket.username || sanitize(message.username, { allowedTags: [] });

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
                    channel.users.push({ username: socket.username, uuid: socket.uuid, points: 0, hasDrawn: false});
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
                        if(channel.game.words.picked != "")
                        socket.emit('reveal_word', { word: channel.game.words.hint });
                    }else{
                        socket.emit('settings_changed', {settings: channel.settings});
                    }

                } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });
            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_format, errorMessage: ERROR_MESSAGES.BODY.wrong_format });        
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
            
            if(channel.game.started){
                if(channel.game.drawer.uuid == socket.uuid)
                {
                    clearTimeout(getTimers[channel.game.timer]);
                    nextDrawer(socket, channel);
                }
            }
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


    socket.on('start_game', () => {
        if(!socket.uuid || !socket.channel) return;

        if (isHost(socket)){
            let channel = channels.find(channel => channel.id == socket.channel);

            if(channel.users.length > 1){

                channel.game.started = true;
                channel.game.round++;
                
                socket.emit('game_start');
                socket.to(socket.channel).emit('game_start');
                
                nextDrawer(socket, channel);

            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.not_enough_players, errorMessage: ERROR_MESSAGES.BODY.not_enough_players });         
        }
    });

    socket.on('change_setting', (message) => {
        if (!socket.uuid || !socket.channel) return;
        if(message.setting.name && message.setting.value) {

            if (isHost(socket)) {
                let name = sanitize(message.setting.name, { allowedTags: [] });
                let value = sanitize(message.setting.value, { allowedTags: [] });
                let channel = channels.find(channel => channel.id == socket.channel);
                
                if(value < 1 || value > 300) return;
                channel.settings[name] = value;
                socket.to(channel.id).emit('settings_changed', { settings: channel.settings });
            }
        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_setting, errorMessage: ERROR_MESSAGES.BODY.missing_setting });         

    });

    socket.on('word_picked', (message) => {
        if (!socket.uuid || !socket.channel) return;
        if (message.word) {
            let word = sanitize(message.word, { allowedTags: [] });

            /* Check if current user channel does exists */
            let channel = channels.find(channel => channel.id == socket.channel);
            if (channel) {

                /* Check if he's the drawer */
                if (channel.game.drawer.uuid == socket.uuid) {
                    
                    let hidden_word = "";
                    while(hidden_word.length < word.length) hidden_word += "_";

                    channel.game.words.picked = word;
                    channel.game.words.hint = hidden_word;
                    
                    socket.emit('hint_word', {word});
                    socket.to(channel.id).emit('hint_word', {word: hidden_word});


                } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.not_the_drawer });
            
            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });

        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_setting, errorMessage: ERROR_MESSAGES.BODY.missing_setting });         
    });

    socket.on('time_out', () => {
        if (!socket.uuid || !socket.channel || !socket.username) return;

        let channel = channels.find(channel => channel.id == socket.channel);
        if (channel) {
            if (new Date() >= channel.game.expires) {
                nextDrawer(socket, channel);
            }
        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });
    })

}

