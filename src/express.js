const {app, sanitize} = require('../app.js');
let { getChannels } = require('./socket.js');


let bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));

/* Routes */

app.get('/', (req, res) => {
    res.render('index', {
        title: "Skribb.lio",
        scripts: ["index.js"]
    });
});

app.post('/sanitize', (req, res) => {
    res.end(sanitize(req.body.content, { allowedTags: [] })) 
})

app.get('/game/:id?', (req, res, next) => {
    /* Check id */
    let id = sanitize(req.params.id, { allowedTags: [] }) || "unknown";
    if (id.length == 36){
        let channel_exists = getChannels().some(channel => channel.id == id);
        if (channel_exists){
            let channel = getChannels().filter(channel => channel.id == id);
            /* All is fine */
            res.render('game', {
                title: "Skribb.lio - Game",
                id,
                scripts: ["game.js", "chat.js"],
                channel: channel
            });
            return;
        }
    }
    next();
});

/* Errors Handeling */

app.use('/game/:id?', (req, res, next) => {
    res.status(400).render('error', {
        title: "Skribb.lio - 400",
        errorType: "400 Bad Request",
        errorMessage: "Navré, cet identifiant n'est pas valide."
    });
});

app.use(function (req, res, next) {
    res.status(404).render('error', {
        title: "Skribb.lio - 404",
        errorType: "404 Not found",
        errorMessage: "Navré, la page demandée n'existe pas"
    });
});