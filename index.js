const app = require('./app.js');
const io = require('socket.io').listen(app.proxy);
const sanitizeHtml = require('sanitize-html');

sanitizeHtml.allowedTags = ['i', 'u', 'strong', 'a'], sanitizeHtml.allowedAttributes = {'a': ['href']};

const authorizedChannels = ['Salon 1', 'Salon 2', 'Salon 3'];

io.sockets.on('connection', (socket) => {

    socket.on('join', (message) => {
        /* Check if user is already in */
        if (message.channel === socket.channel) return;
        /* Check if channel asked is authorized */
        if (!authorizedChannels.includes(message.channel)) return;
        /* Leave all the channels and broadcast it */
        socket.leaveAll();
        socket.broadcast.in(socket.channel).emit('user_left', { username: socket.username });
        /* Sanitize the user's input (never trust users) */
        let clean_username = sanitizeHtml(message.username);
        /* Save date in the socket */
        socket.username = clean_username;
        socket.channel = message.channel
        /* Join the channel and emit to user + members */
        socket.join(message.channel);
        socket.emit('user_joined', {username: clean_username});
        socket.broadcast.in(message.channel).emit('user_joined', {username: clean_username});
        console.log('%s a rejoint le channel : %s', message.username, message.channel);
    });

    socket.on('message', (message) => {
        if(socket.username && socket.channel){
            let clean_content = sanitizeHtml(message.content);
            socket.broadcast.in(socket.channel).emit('user_message', { username: socket.username, content: clean_content});
            socket.emit('user_message', { username: socket.username, content: clean_content })
        }
    })

    socket.on('leave', () => {
        console.log(socket.username + "//" + socket.channel);
        socket.broadcast.in(socket.channel).emit('user_left', { username: socket.username });
    })


    socket.on('disconnect', () => {
        socket.broadcast.in(socket.channel).emit('user_left', { username: socket.username });
    });

});
