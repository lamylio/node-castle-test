
const app = require('../index.js');
/* --- */
const io = require('socket.io').listen(app.http.proxy);
const sanitizeHtml = require('sanitize-html');

const authorizedChannels = ['Salon 1', 'Salon 2', 'Salon 3'];
sanitizeHtml.allowedTags = ['i', 'u', 'strong', 'a'], sanitizeHtml.allowedAttributes = { 'a': ['href'] };

const JOIN_MESSAGE = " a rejoint le salon.";
const LEAVE_MESSAGE = " a quitté le salon.";

const DATE = new Date().toLocaleString();

io.sockets.on('connection', (socket) => {

    socket.on('join', (message) => {
        /* Check if user is already in */
        if (message.channel === socket.channel) return;
        /* Check if channel asked is authorized */
        if (!authorizedChannels.includes(message.channel)) return;
        /* Leave all the channels and broadcast it */
        socket.leaveAll();
        socket.broadcast.in(socket.channel).emit('user_left', { username: socket.username, content: LEAVE_MESSAGE, date: DATE});
        app.postgres.db.insertMessage(socket.username, socket.channel, LEAVE_MESSAGE, 'user_left');
        
        /* Sanitize the user's input (never trust users) */
        let clean_username = sanitizeHtml(message.username);
        /* Save date in the socket */
        socket.username = clean_username;
        socket.channel = message.channel
        
        /* Join the channel and emit to user + members */
        socket.join(message.channel);
        socket.broadcast.in(message.channel).emit('user_joined', { username: clean_username, content: JOIN_MESSAGE, date: DATE});
        app.postgres.db.insertMessage(socket.username, socket.channel, JOIN_MESSAGE, 'user_joined');
        app.postgres.db.getLastMessages(socket.channel, 15, sendManyMessages);
        
        console.log('%s a rejoint le channel : %s', message.username, message.channel);
    });

    function sendManyMessages(err, messages){
        if(err) return;
        console.log(messages);
        for(message of messages){
            socket.emit(message.event, message);
        }
    }

    socket.on('message', (message) => {
        if (socket.username && socket.channel) {
            let clean_content = sanitizeHtml(message.content);
            socket.broadcast.in(socket.channel).emit('user_message', { username: socket.username, content: clean_content, date: DATE });
            socket.emit('user_message', { username: socket.username, content: clean_content, date: DATE})
            app.postgres.db.insertMessage(socket.username, socket.channel, clean_content, 'user_message');
        }
    })

    socket.on('disconnect', () => {
        socket.broadcast.in(socket.channel).emit('user_left', { username: socket.username, content: LEAVE_MESSAGE, date: DATE});
        app.postgres.db.insertMessage(socket.username, socket.channel, LEAVE_MESSAGE, 'user_left');
        app.postgres.db.end();
    });

});

module.exports = {io, authorizedChannels}