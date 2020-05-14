const { sanitize } = require('../../app.js');
const { nextDrawer } = require('../socket.js');

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
                        /* If he's a guesser check if word is valid or wrong 
                        
                        I could get rid of all the accent 
                        content.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        See https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript/37511463#37511463 
                        
                        But Imma use the .localeCompare which is fine too.
                        */
                        
                        if (channel.game.words.picked.localeCompare(content.trim(), 'fr', { sensitivity: 'base' }) == 0){
                            channel.game.words.found.push(socket.uuid);

                            let user = channel.users.find(user => user.uuid == socket.uuid);
                            let drawer = channel.users.find(user => user.uuid == channel.game.drawer.uuid);
                            let increase = Math.floor((channel.game.expires - d) / (10 * (channel.settings.duration / 2)));
                            user.score += increase;
                            drawer.score += Math.floor(increase/channel.users.length);
                            
                            socket.emit('word_found', { username: socket.username, score: increase });
                            socket.to(channel.id).emit('word_found', { username: socket.username, score: increase});
                            
                            setTimeout(() => {
                                if(channel.game.words.found.length < channel.users.length-1) return;
                                if(channel.game.round > channel.settings.rounds) return;
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
                /* Otherwise send just the message */

                socket.emit('message', { username: socket.username, content });
                socket.to(channel.id).emit('message', { username: socket.username, content });

            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });
        }
    });

}