const { sanitize } = require('../../app.js');
const { nextDrawer, getUsersByScore } = require('../socket.js');

/* ----- CHAT EVENTS ----- */
module.exports = function (socket, channels, ERROR_MESSAGES) {

    socket.on('send_message', (message) => {
        if (!socket.username || !socket.uuid || !socket.channel) return;
        if (!message.content) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_content, errorMessage: ERROR_MESSAGES.BODY.missing_content });
        else {
            let content = sanitize(message.content, { allowedTags: ['b', 'i', 'u'] });
            /* Check if current user channel does exists */
            let channel = channels.find(channel => channel.id == socket.channel);
            if (channel) {
                let user = channel.users.find(user => user.uuid == socket.uuid);
                
                /* If game is started */
                if(channel.game.started){

                    /* If a word is choosen */
                    if(channel.game.words.picked != ""){

                        /* If user already found or is the drawer return a cannot_talk error */
                        if (channel.settings.cannot_talk == "true"){
                            let already_found = channel.game.words.found.find(uuid => uuid == socket.uuid);
                            if (channel.game.drawer.uuid == socket.uuid || already_found){
                                socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.cannot_talk, errorMessage: ERROR_MESSAGES.BODY.cannot_talk });
                                return;
                            }
                        }

                        let d = new Date();

                        /* check the commands when game is started */
                        switch (content) {
                            case '/clean':
                            case '/clear':
                                socket.emit('clean_drawing');
                                socket.emit('message', {console: true, content: "<b class='blue-grey-text text-darken-3 center-align'><i class='skicon-pin'></i>Affichage remis à jour</b>"});
                                socket.emit('retrieve_drawing', { url: channel.game.drawURL });                     
                                return;
                            case '/skip':
                                if (channel.host.uuid == socket.uuid) {
                                    socket.to(channel.id).emit('message', { console: true, content: `<b class='blue-grey-text text-darken-3 center-align'><i class='skicon-megaphone'></i>Tour passé par ${user.username}</b>` });
                                    socket.emit('message', { console: true, content: `<b class='blue-grey-text text-darken-3 center-align'><i class='skicon-megaphone'></i>Tour passé par ${user.username}</b>` });
                                    nextDrawer(socket, channel);
                                } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.not_the_host });
                                return;
                            case '/restart':
                                socket.to(channel.id).emit('message', { console: true, content: `<b class='blue-grey-text text-darken-3 center-align'><i class='skicon-megaphone'></i>Partie terminée par ${user.username}</b>` });
                                socket.emit('message', { console: true, content: `<b class='blue-grey-text text-darken-3 center-align'><i class='skicon-megaphone'></i>Partie terminée par ${user.username}</b>` });
                                if (channel.host.uuid == socket.uuid) {
                                    setTimeout(() => {
                                        socket.emit('game_end', { rank: getUsersByScore(channel) });
                                        socket.to(channel.id).emit('game_end', { rank: getUsersByScore(channel) });
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
                                    }, 1500);
                                } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.not_the_host });
                                return;
                            case '/cheat':
                                socket.to(channel.id).emit('message', { console: true, content: `<b class='blue-grey-text text-darken-3 center-align'><i class='skicon-eye'></i>${user.username} vient de tricher. Bouh ! :(</b>` });
                                socket.emit('message', { console: true, content: `<b class='blue-grey-text text-darken-3 center-align'><i class='skicon-eye'></i>Le mot secret est: ${channel.game.words.picked}</b>` });
                                return;
                            default:
                                break;
                        }

                        /* If he's a guesser check if word is valid or wrong 
                       
                       I could get rid of all the accent by using
                       content.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                       See https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript/37511463#37511463 
                       
                       But Imma use the .localeCompare which is fine too.
                       */

                        if (channel.game.words.picked.localeCompare(content.trim(), 'fr', { sensitivity: 'base' }) == 0) {
                            if (channel.game.words.found.some(uuid => uuid == socket.uuid) || channel.game.drawer.uuid == socket.uuid) return;
                            channel.game.words.found.push(socket.uuid);

                            let drawer = channel.users.find(user => user.uuid == channel.game.drawer.uuid);
                            let increase = Math.floor(Math.abs((channel.game.expires - d)) / (5 * channel.settings.duration));
                            user.score += increase;
                            drawer.score += Math.floor(increase / (channel.users.length + 1.1));

                            socket.emit('word_found', { username: socket.username, score: increase });
                            socket.to(channel.id).emit('word_found', { username: socket.username, score: increase });

                            socket.emit('list_users', { users: getUsersByScore(channel) });
                            socket.to(channel.id).emit('list_users', { users: getUsersByScore(channel) });

                            setTimeout(() => {
                                if (channel.game.words.found.length < channel.users.length - 1) return;
                                if (channel.game.round > channel.settings.rounds) return;
                                nextDrawer(socket, channel);
                            }, 1000);

                            return;
                        }
                        if (d >= channel.game.expires) {
                            nextDrawer(socket, channel);
                            return;
                        }

                    }
                }

                /* Others commands */
                switch (content) {
                    case '/becomehost':
                        channel.host = {username: user.username, uuid: user.uuid};
                        socket.emit('host_changed', { username: channel.host.username });
                        socket.to(channel.id).emit('host_changed', { username: channel.host.username });
                        break;
                    default:
                        socket.emit('message', { username: socket.username, content });
                        socket.to(channel.id).emit('message', { username: socket.username, content });
                        break;
                }

               

            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });
        }
    });

}