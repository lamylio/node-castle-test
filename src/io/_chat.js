const { sanitize } = require('../../app.js');
/* ----- CHAT EVENTS ----- */
module.exports = function (socket, channels, ERROR_MESSAGES) {

    socket.on('send_message', (message) => {
        if (!socket.username || !socket.uuid || !socket.channel) return;

        if (!message.token) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_token, errorMessage: ERROR_MESSAGES.BODY.missing_token });
        else if (!message.content) socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.missing_content, errorMessage: ERROR_MESSAGES.BODY.missing_content });
        else {
            let token = sanitize(message.token, { allowedTags: [] });
            let content = sanitize(message.content, { allowedTags: ['b', 'i', 'u'] });

            if (socket.uuid == token) {
                socket.emit('message', { username: socket.username, content });
                socket.to(socket.channel).emit('message', { username: socket.username, content });

                /* TODO - Check for game answer */

                
            } else {
                socket.emit('user_error', { errorTitle: ERROR_MESSAGES.TITLES.wrong_identity, errorMessage: ERROR_MESSAGES.BODY.wrong_identity });
            }
        }
    });

}