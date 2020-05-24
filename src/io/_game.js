const { io, sanitize, manulex, game_stats, throttle, saveStats } = require('../../app.js');
const { nextDrawer, isHost, getUsersByScore } = require('../socket.js');
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
            let host = { username: socket.username, uuid: socket.uuid };
            /* Push the channel object to the list */
            channels.push({
                index: channels.length,
                id: game_id,
                host,
                users: [],
                settings: {
                    duration: 90,
                    rounds: 3,
                    cannot_talk: "false",
                },
                game: {
                    started: false,
                    round: 0,
                    drawer: "",
                    drawURL: "",
                    words: {
                        started: false,
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
                    let user = channel.users.find(user => user.uuid == socket.uuid);
                    if(!user || !user.connected){
                    
                        if(!user){
                            /* Check if the username is already taken */
                            if (channel.users.some(user => user.username == socket.username)) {
                                socket.username = manulex[Math.floor(Math.random() * manulex.length)];
                                socket.emit('username_already_taken', { username: socket.username });
                                socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.username_already_taken, errorMessage: ERROR_MESSAGES.BODY.username_already_taken });
                            }

                            channel.users.push({ username: socket.username, uuid: socket.uuid, score: 0, connected: true, hasDrawn: false });
                        }else user.connected = true;
                        
                        socket.channel = channel.id;
                        /* Join, get users and broadcast it in the channel */
                        socket.join(socket.channel);
                        socket.join(socket.uuid);

                        io.to(channel.id).emit('user_joined', { username: socket.username });
                        io.to(channel.id).emit('list_users', { users: getUsersByScore(channel) });

                        /* Unlock the channel when the host join */
                        if (channel.host.uuid == socket.uuid) {
                            channel.locked = false;
                            socket.emit('host_changed', { username: socket.username });
                        }

                        /* Retrieve the drawer/drawing if game already started */
                        if (channel.game.started){
                            socket.emit('game_start');
                            if(channel.game.drawer.uuid == socket.uuid){
                                if (channel.game.words.picked != "") socket.emit('hint_word', { word: channel.game.words.picked, expires: Math.floor((channel.game.expires - new Date()) / 1000-1) });
                                else socket.emit('pick_word', { words: channel.game.words.proposed });
                            }else{
                                if(channel.game.words.picked != "") socket.emit('hint_word', { word: channel.game.words.hint, expires: Math.floor((channel.game.expires - new Date())/1000-1) });
                            }
                            socket.emit('drawer_changed', { username: channel.game.drawer.username })
                            socket.emit('retrieve_drawing', { url: channel.game.drawURL });
                        }
                        socket.emit('settings_changed', {settings: channel.settings});

                    }else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.token_already_exists, errorMessage: ERROR_MESSAGES.BODY.token_already_exists });
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
            let user = channel.users.find(u => u.uuid == socket.uuid);
            
            user.connected = false;
            io.to(channel.id).emit('user_left', { username: socket.username });

            if (channel.game.started && (channel.game.drawer.uuid == socket.uuid || channel.host.uuid == socket.uuid)) io.to(channel.id).emit('message', { console: true, content: `<b class='pink-text text-darken-4 center-align'><i class='skicon-info-circled'></i>${socket.username} a 10 secondes pour se reconnecter.</b>` });
            
            setTimeout(() => {
                if(user.connected) return;

                /* Filter to remove the disconnected user */
                channel.users = channel.users.filter(user => user.uuid != socket.uuid);
                channel.game.words.found = channel.game.words.found.filter(user => user != socket.uuid);
                
                /* If there's no more user deletes the channel */
                if (channel.users.length == 0) {
                    channels.map(chan => {if(chan.index > channel.index) chan.index--});
                    channels.splice(channel.index, 1);
                    saveStats();
                    return;
                }

                /* Otherwise continue */


                /* If he was the host replace him by the next one */
                if (channel.host.uuid == socket.uuid) {
                    channel.host = channel.users[0];
                    io.to(channel.id).emit('host_changed', { username: channel.host.username });
                }
                
                if(!channel.game.started) return;
                if (channel.users.length == 1) {

                    io.to(channel.id).emit('reveal_word', { word: channel.game.words.picked });
                    io.to(channel.id).emit('game_end', { rank: getUsersByScore(channel) });
                    /* Reset the game propreties */
                    channel.game = {
                        started: false,
                        round: 0,
                        drawer: "",
                        drawURL: "",
                        words: {
                            started: false,
                            hint: "",
                            picked: "",
                            proposed: [],
                            found: [],
                        }
                    };
                    channel.expires = "";
                    channel.users[0].score = 0;
                    channel.users[0].hasDrawn = false;

                } else if (channel.game.drawer.uuid == socket.uuid || channel.users.length - 1 <= channel.game.words.found.length) nextDrawer(socket, channel);
            }, 10 * 1000);
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
                
                io.to(socket.channel).emit('game_start');
                
                nextDrawer(socket, channel);
                
                game_stats.game_count++;
                
            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.not_enough_players, errorMessage: ERROR_MESSAGES.BODY.not_enough_players });         
        }
    });

    socket.on('change_setting', (message) => {
        if (!socket.uuid || !socket.channel) return;
        if(message.setting.name && message.setting.value != undefined) {

            if (isHost(socket)) {
                let name = sanitize(message.setting.name, { allowedTags: [] });
                let value = sanitize(message.setting.value, { allowedTags: [] });
                let channel = channels.find(channel => channel.id == socket.channel);
                
                if(value < 2 || value > 300) return;
                channel.settings[name] = value;
                io.to(channel.id).emit('settings_changed', { settings: channel.settings });
            }
        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_setting, errorMessage: ERROR_MESSAGES.BODY.missing_setting });         

    });

    socket.on('word_picked', (message) => {
        if (!socket.uuid || !socket.channel) return;
        if (message.word) {
            let word = sanitize(message.word, { allowedTags: [] }).toUpperCase();

            /* Check if current user channel does exists */
            let channel = channels.find(channel => channel.id == socket.channel);
            if (channel) {

                /* Check if he's the drawer */
                if (channel.game.drawer.uuid == socket.uuid) {
                    
                    let hidden_word = "";
                    for(let i = 0; i < word.length; i++) {
                        if(word.charAt(i) == "-") hidden_word += "-";
                        else hidden_word += "_";
                    }
                    channel.game.words.picked = word;
                    channel.game.words.hint = hidden_word;
                    channel.game.words.started = true;
                    channel.game.drawer.hasDrawn = true;

                    if (game_stats.frequencies[word]) game_stats.frequencies[word]++;
                    else game_stats.frequencies[word] = 1;

                    let d = new Date();
                    /* 1 second more bc lag */
                    d = new Date(d.getTime() + (1000 * (1 + parseInt(channel.settings.duration))));
                    channel.game.expires = d;
                    
                    socket.emit('hint_word', { word, expires: parseInt(channel.settings.duration)});
                    socket.to(channel.id).emit('hint_word', { word: hidden_word, expires: parseInt(channel.settings.duration)});

                    let drawer = socket.uuid;
                    let round = channel.game.round;
                    
                    let hint_interval, count = 0;
                    let new_hint;
                    setTimeout(() => {
                        hint_interval = setInterval(() => {
                            /* So much conditions lol */
                            if (new Date() >= channel.game.expires || count >= Math.floor(word.length/2) || round != channel.game.round 
                                || drawer != channel.game.drawer.uuid || new_hint == word 
                            || channel.game.words.picked == channel.game.words.hint) {
                                clearInterval(hint_interval);
                                return;
                            }

                            let rd = Math.floor(word.length/2);
                            /* Dont pick a letter which has already been picked */
                            while(channel.game.words.hint.charAt(rd) == word.charAt(rd)){
                                rd = Math.floor(Math.random() * word.length); 
                            }
                            
                            channel.game.words.hint = channel.game.words.hint.substr(0, rd) + word.charAt(rd) + channel.game.words.hint.substr(rd+1);
                            socket.to(channel.id).emit('hint_word', { word: channel.game.words.hint });
                            
                            count++;
                        }, 1000 * parseInt(channel.settings.duration) / 2 / 3);
                    }, 1000 * (parseInt(channel.settings.duration) / 2 - parseInt(channel.settings.duration) / 2 / 3));

                } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.not_the_drawer });
            
            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });

        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_setting, errorMessage: ERROR_MESSAGES.BODY.missing_setting });         
    });

    socket.on('time_out', () => {
        if (!socket.uuid || !socket.channel || !socket.username) return;
        let channel = channels.find(channel => channel.id == socket.channel);
        if (channel) {
            if (channel.game.started) {
                if (new Date() >= channel.game.expires && channel.game.words.started && channel.game.drawer.hasDrawn) {
                    throttle(nextDrawer(socket, channel),5000);
                }
            }
        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });
    })

}

