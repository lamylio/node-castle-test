const {express, app, sanitize, path, manulex} = require('../app.js');
let { getChannels } = require('./socket.js');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Routes */

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/images/favicon.ico'));
})

app.get(['/', '/game'], (req, res) => {
    res.render('index', {
        title: "Skribb.lio",
        scripts: ["index.js"],
        manulex: manulex.length,
    });
});

app.post('/sanitize', (req, res) => {
    res.end(sanitize(req.body.content, { allowedTags: [] })) 
})

/* ----- */

app.get('/game/:id?', (req, res, next) => {
    /* Check id */
    let id = sanitize(req.params.id, { allowedTags: [] });
    if (id.length == 36){
        let channel = getChannels().find(channel => channel.id == id);
        if (channel){
            /* All is fine */
            res.render('game', {
                title: "Skribb.lio - Game",
                scripts: ["chat.js", "game.js", "draw.js"],
                styles: ["game.css"],
                channel: channel,
                id,
            });
            return;
        }
    }
    next();
});

/* Errors Handeling */

app.use(/(game|channel)+\/?(\w)?/, (req, res, next) => {
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