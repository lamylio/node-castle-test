const { sanitize } = require('../../app.js');

/* ----- DRAWING EVENT ----- */
module.exports = function (socket, channels, ERROR_MESSAGES) {

    socket.on('retrieve_drawing', (message) => {
        if (!socket.username || !socket.uuid || !socket.channel) return;

        if (message.token){
            let token = sanitize(message.token, { allowedTags: [] });
            /* Identity check */
            if (socket.uuid == token) {
                /* Check if current user channel exists */
                let channel = channels.find(chan => chan.id == socket.channel);
                if (channel) {
                    /* Don't show the message for the host */
                    if(channel.locked) return;
                    /* Check if game's started */
                    if (channel.game.started) socket.emit('retrieve_drawing', { url: channel.game.drawURL });

                } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });
            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.wrong_identity });
        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_token, errorMessage: ERROR_MESSAGES.BODY.missing_token });
        
    })

    socket.on('drawing', (message) => {
        if (!socket.username || !socket.uuid || !socket.channel) return;
        /* Need a token */
        if (message.token){
            /* Need the ImageURL */
            if (message.url) {
                let token = sanitize(message.token, { allowedTags: [] });
                /* Identity check */
                if(socket.uuid == token){
                    /* Check if user current channel exists */
                    let channel = channels.find(chan => chan.id == socket.channel);
                    if (channel) {
                        let url = sanitize(message.url, { allowedTags: [] });

                        /* Check if game's started */
                        if (channel.game.started) {
                            /* Check if he's the drawer */
                            if (channel.game.drawer.uuid == socket.uuid){
                                channel.game.drawURL = url;
                                socket.to(socket.channel).emit('retrieve_drawing', { url: url });
                            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.not_the_drawer });
                        
                        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_started, errorMessage: ERROR_MESSAGES.BODY.game_not_started });
                    } else  socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.game_not_found, errorMessage: ERROR_MESSAGES.BODY.game_not_found });
                } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.wrong_identity });                
            } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_draw, errorMessage: ERROR_MESSAGES.BODY.missing_draw });
        } else socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_token, errorMessage: ERROR_MESSAGES.BODY.missing_token });

    });

}