const {io, sanitize} = require('../app.js');

//const DATE = new Date().toLocaleString();

let channels = [];

io.sockets.on('connection', (socket) => {

    socket.on('create_game', message => {
        /* Need an username to create a game */
        if (!message.username) socket.emit('user_error', {errorTitle: "Nom d'utilisateur introuvable", errorMessage: "Veuillez définir un nom d'utilisateur avant de vouloir jouer"});
        else{
            socket.username = socket.username || sanitize(message.username, { allowedTags: [] });;

            /* Register the channel */
            channels.push({
                host: socket.username, 
                id: socket.id, 
                users: [],
                settings: {
                    timer: 90
                },
                locked: true
            });
            /* Notify the user and send the link (id) of the game */
            socket.emit('game_created', {id: socket.id, username: socket.username});
            socket.join(socket.id);

            console.log("Game %s created by %s and locked.", socket.id, socket.username);
            console.log('------');
        }
    });

    socket.on('join_game', message => {
        /* Need an username to join a game */
        if (!message.username) socket.emit('user_error', { errorTitle: "Nom d'utilisateur introuvable", errorMessage: "Veuillez définir un nom d'utilisateur avant de vouloir jouer" });
        else {
            socket.username = socket.username || sanitize(message.username, { allowedTags: [] });;
            /* Check the id is the right form */
            let id = sanitize(message.id, { allowedTags: [] }) || "unknown";
            if (id.length == 20) {
                /* Check if the channel with that id exists */
                let exists = channels.some(channel => channel.id == id);
                if(exists){
                    /* Catch it */
                    let channel = channels.filter(channel => channel.id == id);
                    channel = channel[0];

                    /* Check if the username is already taken */
                    let same_username_exists = channel.users.some(user => user == socket.username);
                    if (same_username_exists){
                        let same_username = channel.users.filter(user => user == socket.username);
                        socket.username = socket.username +  " (" + same_username.length + ")";
                        console.log("Username already taken, becomes %s", socket.username);
                    }

                    /* Register the joining user */
                    channel.users.push(socket.username);
                    /* Unlock the channel */
                    channel.locked = false;

                    /* Join and broadcast it in the cannel */
                    socket.join(message.id);
                    socket.broadcast.in(message.id).emit('user_joined', {username: socket.username});
                    socket.inGame = true;

                    console.log("%s joined the game %s", socket.username, message.id);
                    console.log(channel);
                    console.log('------');
                }else{
                    socket.emit('user_error', { errorTitle: "Partie introuvable", errorMessage: ("La partie avec l'identifiant "  + message.id + " n'existe pas..") });
                }
            }else{
                socket.emit('user_error', {errorTitle: "Mauvais identifiant", errorMessage: ("L'identifiant " + message.id + " ne respecte pas le format." )});
            }
        }
    });

    socket.on('disconnect', message => {
        /* If the user doesn't exists, skip */
        if (!socket.username) return;
        console.log("%s disconnect", socket.username);
        /* As he leaves, quit all channel */
        socket.leaveAll();
        /* Remove the channel by filtering it with a custom func */
        channels = channels.filter((channel) => {
            if(channel.locked) return channel;
            else{
                /* Filter to remove the disconnected user */
                channel.users = channel.users.filter(user => user != socket.username);

                /* If there's no more user break here */
                if(channel.users.length == 0) return;

                /* Otherwise, if he was the host replace him by the next one */
                if (channel.host == socket.username) {
                    channel.host = channel.users[0] || "";
                    console.log("%s is the new host.", channel.host);
                }
                return channel;
            }
        });
        console.log("Channels are now as :");
        console.log(channels);
        console.log('------');
    });
});

module.exports = {channels}